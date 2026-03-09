from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from db import Base


class Floor(Base):
    __tablename__ = "floors"
    id_floor = Column(Integer, primary_key=True, autoincrement=True)
    floor_name = Column(String(50), nullable=False)
    id_location = Column(Integer, ForeignKey("locations.id_location"), nullable=True)
    
    # Relationships
    location = relationship("Location", back_populates="floors")
    stations = relationship("Station", foreign_keys="Station.id_floor", back_populates="floor")
