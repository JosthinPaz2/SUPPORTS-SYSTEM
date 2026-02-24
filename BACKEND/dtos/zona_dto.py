from typing import Optional
from pydantic import BaseModel


class ZonaBase(BaseModel):
    nombre_zona: str


class ZonaCreate(ZonaBase):
    pass


class ZonaUpdate(ZonaBase):
    pass


class ZonaOut(ZonaBase):
    id_zona: int

    class Config:
        from_attributes = True
