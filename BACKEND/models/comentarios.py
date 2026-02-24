from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, TIMESTAMP, func
from sqlalchemy.orm import relationship

from db import Base


class Comentario(Base):
    __tablename__ = "comentarios"
    id_comentario = Column(Integer, primary_key=True, autoincrement=True)
    id_ticket = Column(Integer, ForeignKey("tickets.id_ticket"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    contenido = Column(Text, nullable=False)
    es_nota_interna = Column(Boolean, default=False)
    evidencia_url = Column(String(255), nullable=True)
    fecha_registro = Column(TIMESTAMP, default=func.current_timestamp())
    
    # Relaciones
    ticket = relationship("Ticket", back_populates="comentarios")
    usuario = relationship("Usuario", back_populates="comentarios")
