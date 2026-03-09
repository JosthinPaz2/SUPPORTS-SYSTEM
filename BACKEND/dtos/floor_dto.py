from typing import Optional
from pydantic import BaseModel


class FloorBase(BaseModel):
    floor_name: str
    id_location: int


class FloorCreate(FloorBase):
    pass


class FloorUpdate(BaseModel):
    floor_name: Optional[str] = None
    id_location: Optional[int] = None


class FloorOut(FloorBase):
    id_floor: int

    class Config:
        from_attributes = True
