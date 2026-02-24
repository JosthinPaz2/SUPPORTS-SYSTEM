from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime


class UsuarioBase(BaseModel):
    nombre_completo: str
    correo_institucional: str
    id_rol: int


class UsuarioCreate(UsuarioBase):
    contrasena_hash: str


class UsuarioUpdate(BaseModel):
    nombre_completo: Optional[str] = None
    correo_institucional: Optional[str] = None
    id_rol: Optional[int] = None


class UsuarioOut(UsuarioBase):
    id_usuario: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True


# DTOs para Autenticación
class RegistroRequest(BaseModel):
    nombre_completo: str
    correo_institucional: EmailStr
    contrasena: str
    id_rol: int = 2  # Por defecto rol de usuario (ajustar según tus roles)


class LoginRequest(BaseModel):
    correo_institucional: EmailStr
    contrasena: str


class LoginResponse(BaseModel):
    id_usuario: int
    nombre_completo: str
    correo_institucional: str
    access_token: str
    token_type: str = "bearer"


class SolicitudRecuperacionRequest(BaseModel):
    correo_institucional: EmailStr


class VerificarCodigoRequest(BaseModel):
    correo_institucional: EmailStr
    codigo: str


class ReestablecerContraRequest(BaseModel):
    correo_institucional: EmailStr
    codigo: str
    nueva_contrasena: str


class ReestablecerContraResponse(BaseModel):
    mensaje: str
