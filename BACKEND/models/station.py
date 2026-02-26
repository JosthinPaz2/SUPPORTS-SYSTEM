from sqlalchemy import Column, String, Integer, ForeignKey, Enum, TIMESTAMP, func
from sqlalchemy.orm import relationship
import enum

from db import Base


class EstadoEstacion(str, enum.Enum):
    DISPONIBLE = "Available"
    NO_DISPONIBLE = "Not available"
    DISPONIBLE_CON_HALLAZGOS = "Available with issues"


class Station(Base):
    __tablename__ = "stations"
    id_station = Column(String(20), primary_key=True)
    id_zone = Column(Integer, ForeignKey("zones.id_zone"), nullable=False)
    current_status = Column(Enum(EstadoEstacion), default=EstadoEstacion.DISPONIBLE)
    operating_system = Column(String(50), nullable=True)
    last_updated = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    zone = relationship("Zone", back_populates="stations")
    tickets = relationship("Ticket", back_populates="station")
