from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    TIMESTAMP,
    func,
)
from sqlalchemy.orm import relationship
from datetime import datetime

from db import Base


class Usuario(Base):
    __tablename__ = "usuarios"
    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    nombre_completo = Column(String(100), nullable=False)
    correo_institucional = Column(String(100), unique=True, nullable=False)
    contrasena_hash = Column(String(255), nullable=False)
    id_rol = Column(Integer, ForeignKey("roles.id_rol"), nullable=False)
    fecha_creacion = Column(TIMESTAMP, default=func.current_timestamp())
    
    # Campos para recuperación de contraseña
    codigo_recuperacion = Column(String(6), nullable=True)  # Código de 6 dígitos
    fecha_expiracion_codigo = Column(TIMESTAMP, nullable=True)
    
    # Relaciones
    rol = relationship("Rol", back_populates="usuarios")
    tickets_creados = relationship("Ticket", foreign_keys="Ticket.id_usuario_creador", back_populates="usuario_creador")
    tickets_asignados = relationship("Ticket", foreign_keys="Ticket.id_tecnico_asignado", back_populates="tecnico_asignado")
    comentarios = relationship("Comentario", back_populates="usuario")
    notificaciones = relationship("Notificacion", back_populates="usuario")