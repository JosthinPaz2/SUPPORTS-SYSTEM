from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from db import Base


class Category(Base):
    __tablename__ = "categories"
    id_category = Column(Integer, primary_key=True, autoincrement=True)
    category_name = Column(String(50), nullable=False)
    
    # Relationships
    tickets = relationship("Ticket", back_populates="category")
