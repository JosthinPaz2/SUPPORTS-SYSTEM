from sqlalchemy import Column, String, Integer, ForeignKey, Enum, TIMESTAMP, func
from sqlalchemy.orm import relationship
import enum

from db import Base


class EstadoEstacion(str, enum.Enum):
    DISPONIBLE = "Available"
    NO_DISPONIBLE = "Not available"
    DISPONIBLE_CON_HALLAZGOS = "Available with findings"


class Estacion(Base):
    __tablename__ = "estaciones"
    id_estacion = Column(String(20), primary_key=True)
    id_zona = Column(Integer, ForeignKey("zonas.id_zona"), nullable=False)
    estado_actual = Column(Enum(EstadoEstacion), default=EstadoEstacion.DISPONIBLE)
    sistema_operativo = Column(String(50), nullable=True)
    ultima_actualizacion = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relaciones
    zona = relationship("Zona", back_populates="estaciones")
    tickets = relationship("Ticket", back_populates="estacion")
