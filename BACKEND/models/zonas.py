from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from db import Base


class Zona(Base):
    __tablename__ = "zonas"
    id_zona = Column(Integer, primary_key=True, autoincrement=True)
    nombre_zona = Column(String(50), nullable=False)
    
    # Relaciones
    estaciones = relationship("Estacion", back_populates="zona")
