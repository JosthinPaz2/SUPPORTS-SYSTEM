from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from db import Base


class Categoria(Base):
    __tablename__ = "categorias"
    id_categoria = Column(Integer, primary_key=True, autoincrement=True)
    nombre_categoria = Column(String(50), nullable=False)
    
    # Relaciones
    tickets = relationship("Ticket", back_populates="categoria")
