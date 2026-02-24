from sqlalchemy import (
    Column,
    Integer,
    String,
    TIMESTAMP,
    func,
)
from sqlalchemy.orm import relationship
from datetime import datetime

from db import Base


class Rol(Base):
    __tablename__ = "roles"
    id_rol = Column(Integer, primary_key=True, autoincrement=True)
    nombre_rol = Column(String(50), unique=True, nullable=False)
    
    # Relaciones
    usuarios = relationship("Usuario", back_populates="rol")
