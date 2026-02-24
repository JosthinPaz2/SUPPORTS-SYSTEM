from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from db.session import SessionLocal
from dtos.usuario_dto import (
    UsuarioCreate, UsuarioOut, UsuarioUpdate,
    RegistroRequest, LoginRequest, LoginResponse,
    SolicitudRecuperacionRequest, VerificarCodigoRequest,
    ReestablecerContraRequest, ReestablecerContraResponse
)
from models.usuarios import Usuario
from utils.security import (
    hash_password, verify_password, create_access_token,
    generate_recovery_code, generate_code_expiration
)
from utils.email_service import send_recovery_email, send_welcome_email

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==================== ENDPOINTS DE AUTENTICACIÓN ====================

@router.post("/registro", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def registro(registro: RegistroRequest, db: Session = Depends(get_db)):
    """
    Registrar un nuevo usuario
    """
    # Verificar si el correo ya existe
    usuario_existente = db.query(Usuario).filter(
        Usuario.correo_institucional == registro.correo_institucional
    ).first()
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo institucional ya está registrado"
        )
    
    # Hashear contraseña
    contrasena_hash = hash_password(registro.contrasena)
    
    # Crear nuevo usuario
    nuevo_usuario = Usuario(
        nombre_completo=registro.nombre_completo,
        correo_institucional=registro.correo_institucional,
        contrasena_hash=contrasena_hash,
        id_rol=registro.id_rol
    )
    
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    # Enviar email de bienvenida
    await send_welcome_email(nuevo_usuario.correo_institucional, nuevo_usuario.nombre_completo)
    
    # Generar token de acceso
    access_token = create_access_token(
        data={"sub": str(nuevo_usuario.id_usuario), "correo": nuevo_usuario.correo_institucional}
    )
    
    return LoginResponse(
        id_usuario=nuevo_usuario.id_usuario,
        nombre_completo=nuevo_usuario.nombre_completo,
        correo_institucional=nuevo_usuario.correo_institucional,
        access_token=access_token
    )


@router.post("/login", response_model=LoginResponse)
def login(credenciales: LoginRequest, db: Session = Depends(get_db)):
    """
    Iniciar sesión con correo y contraseña
    """
    # Buscar usuario por correo
    usuario = db.query(Usuario).filter(
        Usuario.correo_institucional == credenciales.correo_institucional
    ).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos"
        )
    
    # Verificar contraseña
    if not verify_password(credenciales.contrasena, usuario.contrasena_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos"
        )
    
    # Generar token de acceso
    access_token = create_access_token(
        data={"sub": str(usuario.id_usuario), "correo": usuario.correo_institucional}
    )
    
    return LoginResponse(
        id_usuario=usuario.id_usuario,
        nombre_completo=usuario.nombre_completo,
        correo_institucional=usuario.correo_institucional,
        access_token=access_token
    )


@router.post("/solicitar-recuperacion")
async def solicitar_recuperacion(solicitud: SolicitudRecuperacionRequest, db: Session = Depends(get_db)):
    """
    Solicitar recuperación de contraseña. Envía un código al correo
    """
    usuario = db.query(Usuario).filter(
        Usuario.correo_institucional == solicitud.correo_institucional
    ).first()
    
    if not usuario:
        # No revelar si el correo existe (por seguridad)
        return {"mensaje": "Si el correo existe en el sistema, recibirás un código de recuperación"}
    
    # Generar código de recuperación
    codigo = generate_recovery_code()
    fecha_expiracion = generate_code_expiration()
    
    # Guardar código en base de datos
    usuario.codigo_recuperacion = codigo
    usuario.fecha_expiracion_codigo = fecha_expiracion
    db.commit()
    
    # Enviar email con código
    email_enviado = await send_recovery_email(usuario.correo_institucional, codigo, usuario.nombre_completo)
    
    if not email_enviado:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al enviar el correo de recuperación"
        )
    
    return {"mensaje": "Se ha enviado un código de recuperación a tu correo electrónico"}


@router.post("/verificar-codigo")
def verificar_codigo(solicitud: VerificarCodigoRequest, db: Session = Depends(get_db)):
    """
    Verificar que el código de recuperación sea válido
    """
    usuario = db.query(Usuario).filter(
        Usuario.correo_institucional == solicitud.correo_institucional
    ).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar que exista un código
    if not usuario.codigo_recuperacion:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay una solicitud de recuperación activa"
        )
    
    # Verificar que el código no haya expirado
    if datetime.utcnow() > usuario.fecha_expiracion_codigo:
        usuario.codigo_recuperacion = None
        usuario.fecha_expiracion_codigo = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código ha expirado. Solicita uno nuevo"
        )
    
    # Verificar el código
    if usuario.codigo_recuperacion != solicitud.codigo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código es incorrecto"
        )
    
    return {"mensaje": "Código verificado correctamente"}


@router.post("/reestablecer-contrasena", response_model=ReestablecerContraResponse)
def reestablecer_contrasena(solicitud: ReestablecerContraRequest, db: Session = Depends(get_db)):
    """
    Reestablecer contraseña usando el código de recuperación
    """
    usuario = db.query(Usuario).filter(
        Usuario.correo_institucional == solicitud.correo_institucional
    ).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar que exista un código
    if not usuario.codigo_recuperacion:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay una solicitud de recuperación activa"
        )
    
    # Verificar que el código no haya expirado
    if datetime.utcnow() > usuario.fecha_expiracion_codigo:
        usuario.codigo_recuperacion = None
        usuario.fecha_expiracion_codigo = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código ha expirado. Solicita uno nuevo"
        )
    
    # Verificar el código
    if usuario.codigo_recuperacion != solicitud.codigo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código es incorrecto"
        )
    
    # Actualizar contraseña
    usuario.contrasena_hash = hash_password(solicitud.nueva_contrasena)
    usuario.codigo_recuperacion = None
    usuario.fecha_expiracion_codigo = None
    
    db.commit()
    
    return ReestablecerContraResponse(
        mensaje="Contraseña reestablecida correctamente. Por favor inicia sesión con tu nueva contraseña"
    )


# ==================== ENDPOINTS CRUD ESTÁNDAR ====================

@router.post("/", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def crear_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    # Verificar si el correo ya existe
    usuario_existente = db.query(Usuario).filter(
        Usuario.correo_institucional == usuario.correo_institucional
    ).first()
    if usuario_existente:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    db_usuario = Usuario(**usuario.dict())
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario


@router.get("/", response_model=list[UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db)):
    usuarios = db.query(Usuario).all()
    return usuarios


@router.get("/{usuario_id}", response_model=UsuarioOut)
def obtener_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.put("/{usuario_id}", response_model=UsuarioOut)
def actualizar_usuario(usuario_id: int, usuario: UsuarioUpdate, db: Session = Depends(get_db)):
    db_usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    for key, value in usuario.dict(exclude_unset=True).items():
        setattr(db_usuario, key, value)
    
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    db_usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db.delete(db_usuario)
    db.commit()
    return None