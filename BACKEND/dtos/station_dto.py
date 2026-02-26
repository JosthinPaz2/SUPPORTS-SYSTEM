from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class StationBase(BaseModel):
    id_station: str
    id_zone: int
    operating_system: Optional[str] = None


class StationCreate(StationBase):
    pass


class StationUpdate(BaseModel):
    id_zone: Optional[int] = None
    current_status: Optional[str] = None
    operating_system: Optional[str] = None


class StationOut(StationBase):
    current_status: str
    last_updated: datetime

    class Config:
        from_attributes = True
