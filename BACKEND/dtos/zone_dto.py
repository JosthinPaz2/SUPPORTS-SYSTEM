from typing import Optional
from pydantic import BaseModel


class ZoneBase(BaseModel):
    zone_name: str
    id_location: int


class ZoneCreate(ZoneBase):
    pass


class ZoneUpdate(BaseModel):
    zone_name: Optional[str] = None
    id_location: Optional[int] = None


class ZoneOut(ZoneBase):
    id_zone: int

    class Config:
        from_attributes = True
