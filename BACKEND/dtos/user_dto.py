from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserBase(BaseModel):
    full_name: str
    institutional_email: str
    id_role: int
    campaign: str  # T-Mobile, ARS, or ATYT


class UserCreate(UserBase):
    password_hash: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    institutional_email: Optional[str] = None
    id_role: Optional[int] = None


class UserOut(UserBase):
    id_user: int
    created_at: datetime
    recovery_code: Optional[str] = None
    recovery_code_expiration: Optional[datetime] = None
    failed_login_attempts: Optional[int] = 0
    last_failed_login: Optional[datetime] = None
    locked_until: Optional[datetime] = None

    class Config:
        from_attributes = True


# Authentication DTOs
from typing import Literal

class RegisterRequest(BaseModel):
    full_name: str
    institutional_email: EmailStr
    password: str
    campaign: Literal['T-Mobile', 'ARS', 'ATYT']
    id_role: int = 2  # default user role


class LoginRequest(BaseModel):
    institutional_email: EmailStr
    password: str


class LoginResponse(BaseModel):
    id_user: int
    full_name: str
    institutional_email: str
    role_name: str
    id_role: int
    campaign: Optional[str] = None
    access_token: str
    token_type: str = "bearer"


class PasswordRecoveryRequest(BaseModel):
    institutional_email: EmailStr


class VerifyCodeRequest(BaseModel):
    institutional_email: EmailStr
    code: str


class ResetPasswordRequest(BaseModel):
    institutional_email: EmailStr
    code: str
    new_password: str


class ResetPasswordResponse(BaseModel):
    message: str
