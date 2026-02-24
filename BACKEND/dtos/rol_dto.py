from typing import Optional
from pydantic import BaseModel


class RolBase(BaseModel):
    nombre_rol: str


class RolCreate(RolBase):
    pass


class RolUpdate(RolBase):
    pass


class RolOut(RolBase):
    id_rol: int

    class Config:
        from_attributes = True
