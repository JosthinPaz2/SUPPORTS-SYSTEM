from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, TIMESTAMP, func
from sqlalchemy.orm import relationship

from db import Base


class Notificacion(Base):
    __tablename__ = "notificaciones"
    id_notificacion = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    mensaje = Column(Text)
    leida = Column(Boolean, default=False)
    fecha_envio = Column(TIMESTAMP, default=func.current_timestamp())
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="notificaciones")
