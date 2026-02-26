from typing import Optional
from pydantic import BaseModel


class LocationBase(BaseModel):
    location_name: str


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    location_name: Optional[str] = None


class LocationOut(LocationBase):
    id_location: int

    class Config:
        from_attributes = True
