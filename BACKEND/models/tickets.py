from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, TIMESTAMP, func
from sqlalchemy.orm import relationship
import enum

from db import Base


class EstadoTicket(str, enum.Enum):
    PENDIENTE = "Pendiente"
    EN_PROCESO = "En Proceso"
    RESUELTO = "Resuelto"


class Ticket(Base):
    __tablename__ = "tickets"
    id_ticket = Column(Integer, primary_key=True, autoincrement=True)
    titulo = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=False)
    estado = Column(Enum(EstadoTicket), default=EstadoTicket.PENDIENTE)
    id_categoria = Column(Integer, ForeignKey("categorias.id_categoria"), nullable=False)
    id_prioridad = Column(Integer, ForeignKey("prioridades.id_prioridad"), nullable=False)
    id_usuario_creador = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    id_tecnico_asignado = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    id_estacion = Column(String(20), ForeignKey("estaciones.id_estacion"), nullable=True)
    fecha_creacion = Column(TIMESTAMP, default=func.current_timestamp())
    fecha_resolucion = Column(TIMESTAMP, nullable=True)
    
    # Relaciones
    categoria = relationship("Categoria", back_populates="tickets")
    prioridad = relationship("Prioridad", back_populates="tickets")
    usuario_creador = relationship("Usuario", foreign_keys=[id_usuario_creador], back_populates="tickets_creados")
    tecnico_asignado = relationship("Usuario", foreign_keys=[id_tecnico_asignado], back_populates="tickets_asignados")
    estacion = relationship("Estacion", back_populates="tickets")
    comentarios = relationship("Comentario", back_populates="ticket")
