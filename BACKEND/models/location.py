from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from db import Base


class Location(Base):
    __tablename__ = "locations"
    id_location = Column(Integer, primary_key=True, autoincrement=True)
    location_name = Column(String(100), nullable=False)
    
    # Relationships
    zones = relationship("Zone", back_populates="location")
