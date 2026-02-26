from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from db import Base


class Zone(Base):
    __tablename__ = "zones"
    id_zone = Column(Integer, primary_key=True, autoincrement=True)
    zone_name = Column(String(50), nullable=False)
    id_location = Column(Integer, ForeignKey("locations.id_location"), nullable=True)
    
    # Relationships
    location = relationship("Location", back_populates="zones")
    stations = relationship("Station", back_populates="zone")
