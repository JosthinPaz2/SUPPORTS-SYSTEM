from sqlalchemy import Column, String, Integer, ForeignKey, Enum, TIMESTAMP, func, Float
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
    id_floor = Column(Integer, ForeignKey("floors.id_floor"), nullable=False)
    # id_zone is used by the office mapping module and references the selected floor/zone.
    id_zone = Column(Integer, ForeignKey("floors.id_floor"), nullable=True, index=True)
    current_status = Column(Enum(EstadoEstacion), default=EstadoEstacion.DISPONIBLE)
    operating_system = Column(String(50), nullable=True)
    pos_x = Column(Float, nullable=True, default=0)
    pos_y = Column(Float, nullable=True, default=0)
    rotation = Column(Integer, nullable=False, default=0)
    width = Column(Float, nullable=False, default=8)
    height = Column(Float, nullable=False, default=4)
    last_updated = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    floor = relationship("Floor", foreign_keys=[id_floor], back_populates="stations")
    tickets = relationship("Ticket", back_populates="station")
