from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class StationBase(BaseModel):
    id_station: str
    id_floor: int
    id_zone: Optional[int] = None
    pos_x: Optional[float] = 0
    pos_y: Optional[float] = 0
    rotation: Optional[int] = 0
    width: Optional[float] = 8
    height: Optional[float] = 4


class StationCreate(StationBase):
    pass


class StationUpdate(BaseModel):
    id_floor: Optional[int] = None
    id_zone: Optional[int] = None
    current_status: Optional[str] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    rotation: Optional[int] = None
    width: Optional[float] = None
    height: Optional[float] = None


class StationOut(StationBase):
    current_status: str
    last_updated: datetime

    class Config:
        from_attributes = True
