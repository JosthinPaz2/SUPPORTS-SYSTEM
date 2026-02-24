from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class EstacionBase(BaseModel):
    id_estacion: str
    id_zona: int
    sistema_operativo: Optional[str] = None


class EstacionCreate(EstacionBase):
    pass


class EstacionUpdate(BaseModel):
    id_zona: Optional[int] = None
    estado_actual: Optional[str] = None
    sistema_operativo: Optional[str] = None


class EstacionOut(EstacionBase):
    estado_actual: str
    ultima_actualizacion: datetime

    class Config:
        from_attributes = True
