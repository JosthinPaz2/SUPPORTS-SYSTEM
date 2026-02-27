from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

from db.session import SessionLocal
from dtos.user_dto import (
    UserCreate, UserOut, UserUpdate,
    RegisterRequest, LoginRequest, LoginResponse,
    PasswordRecoveryRequest, VerifyCodeRequest,
    ResetPasswordRequest, ResetPasswordResponse
)
from models.user import User
from utils.security import (
    hash_password, verify_password, create_access_token,
    generate_recovery_code, generate_code_expiration
)
from utils.email_service import send_recovery_email, send_welcome_email

router = APIRouter(prefix="/users", tags=["users"])
logger = logging.getLogger(__name__)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==================== ENDPOINTS DE AUTENTICACIÓN ====================

@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register(register_data: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user
    """
    # check if email already exists
    existing_user = db.query(User).filter(
        User.institutional_email == register_data.institutional_email
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Institutional email already registered"
        )
    
    # validate password strength (at least one uppercase, number, symbol, length>=8)
    pwd = register_data.password
    if len(pwd) < 8 or \
       not any(c.isupper() for c in pwd) or \
       not any(c.isdigit() for c in pwd) or \
       not any(c in "!@#$%^&*()_+-=[]{}|;':\",.<>/?`~" for c in pwd):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters and include uppercase, number and symbol"
        )
    # prevent password containing name or email
    if register_data.full_name.lower() in pwd.lower() or register_data.institutional_email.lower() in pwd.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password should not contain your name or email"
        )

    # ensure role is not admin (1)
    if getattr(register_data, 'id_role', 2) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot register with admin role"
        )

    # hash password
    password_hash = hash_password(pwd)
    
    # create user (force role 2 regardless of request)
    new_user = User(
        full_name=register_data.full_name,
        institutional_email=register_data.institutional_email,
        password_hash=password_hash,
        id_role=2,
        campaign=register_data.campaign
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # send welcome email (non-blocking)
    try:
        await send_welcome_email(new_user.institutional_email, new_user.full_name)
    except Exception as e:
        logger.warning("Failed to send welcome email to %s: %s", new_user.institutional_email, e)
    
    # generate access token
    access_token = create_access_token(
        data={"sub": str(new_user.id_user), "email": new_user.institutional_email}
    )
    
    return LoginResponse(
        id_user=new_user.id_user,
        full_name=new_user.full_name,
        institutional_email=new_user.institutional_email,
        role_name=new_user.role.role_name if new_user.role else "employee",
        campaign=new_user.campaign,
        access_token=access_token
    )


@router.post("/login", response_model=LoginResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with email and password
    Implements account lockout after 3 failed attempts (5 minute lock)
    """
    user = db.query(User).filter(
        User.institutional_email == credentials.institutional_email
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password incorrect"
        )
    
    # Check if user is locked out
    if user.locked_until and datetime.utcnow() < user.locked_until:
        remaining_minutes = int((user.locked_until - datetime.utcnow()).total_seconds() / 60)
        remaining_seconds = int((user.locked_until - datetime.utcnow()).total_seconds() % 60)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account locked. Try again in {remaining_minutes}m {remaining_seconds}s"
        )
    
    # Reset lock if time has passed
    if user.locked_until and datetime.utcnow() >= user.locked_until:
        user.locked_until = None
        user.failed_login_attempts = 0
        db.commit()
    
    if not verify_password(credentials.password, user.password_hash):
        # Increment failed attempts
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        user.last_failed_login = datetime.utcnow()
        
        # Lock account if 3 failed attempts
        if user.failed_login_attempts >= 3:
            user.locked_until = datetime.utcnow() + timedelta(minutes=5)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed login attempts. Account locked for 5 minutes."
            )
        
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password incorrect"
        )
    
    # Reset failed attempts on successful login
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    
    access_token = create_access_token(
        data={"sub": str(user.id_user), "email": user.institutional_email}
    )
    
    return LoginResponse(
        id_user=user.id_user,
        full_name=user.full_name,
        institutional_email=user.institutional_email,
        role_name=user.role.role_name if user.role else "employee",
        campaign=user.campaign,
        access_token=access_token
    )


@router.post("/request-recovery")
async def request_password_recovery(request: PasswordRecoveryRequest, db: Session = Depends(get_db)):
    """
    Request password recovery; sends code by email
    """
    user = db.query(User).filter(
        User.institutional_email == request.institutional_email
    ).first()
    
    if not user:
        return {"message": "If the email exists, a recovery code will be sent"}
    
    code = generate_recovery_code()
    expiration = generate_code_expiration()
    
    user.recovery_code = code
    user.recovery_code_expiration = expiration
    db.commit()
    
    email_sent = await send_recovery_email(user.institutional_email, code, user.full_name)
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send recovery email"
        )
    
    return {"message": "Recovery code sent to your email"}


@router.post("/verify-code")
def verify_code(request: VerifyCodeRequest, db: Session = Depends(get_db)):
    """
    Verify recovery code validity
    """
    user = db.query(User).filter(
        User.institutional_email == request.institutional_email
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.recovery_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active recovery request"
        )
    
    if datetime.utcnow() > user.recovery_code_expiration:
        user.recovery_code = None
        user.recovery_code_expiration = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code expired. Request a new one"
        )
    
    if user.recovery_code != request.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code incorrect"
        )
    
    return {"message": "Code verified successfully"}


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset password using recovery code
    """
    user = db.query(User).filter(
        User.institutional_email == request.institutional_email
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.recovery_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active recovery request"
        )
    
    if datetime.utcnow() > user.recovery_code_expiration:
        user.recovery_code = None
        user.recovery_code_expiration = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code expired. Request a new one"
        )
    
    if user.recovery_code != request.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code incorrect"
        )
    
    user.password_hash = hash_password(request.new_password)
    user.recovery_code = None
    user.recovery_code_expiration = None
    
    db.commit()
    
    return ResetPasswordResponse(
        message="Password reset successfully. Please login with your new password"
    )


# ==================== STANDARD CRUD ENDPOINTS ====================

@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        User.institutional_email == user.institutional_email
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id_user == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id_user == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for key, value in user.dict(exclude_unset=True).items():
        setattr(db_user, key, value)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id_user == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(db_user)
    db.commit()
    return None