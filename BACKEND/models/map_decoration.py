from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from db import Base


class MapDecoration(Base):
    __tablename__ = "map_decorations"

    id_decoration = Column(Integer, primary_key=True, autoincrement=True)
    id_zone = Column(Integer, ForeignKey("floors.id_floor"), nullable=False, index=True)
    decoration_type = Column(String(50), nullable=False)
    label = Column(String(100), nullable=True)
    pos_x = Column(Float, nullable=False, default=0)
    pos_y = Column(Float, nullable=False, default=0)
    width = Column(Float, nullable=False, default=10)
    height = Column(Float, nullable=False, default=10)
    rotation = Column(Integer, nullable=False, default=0)
    color = Column(String(30), nullable=True)

    zone = relationship("Floor")
