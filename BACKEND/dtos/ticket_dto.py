from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class TicketBase(BaseModel):
    titulo: str
    descripcion: str
    id_categoria: int
    id_usuario_creador: int
    id_tecnico_asignado: Optional[int] = None
    id_estacion: Optional[str] = None


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    estado: Optional[str] = None
    id_categoria: Optional[int] = None
    id_tecnico_asignado: Optional[int] = None
    id_estacion: Optional[str] = None
    fecha_resolucion: Optional[datetime] = None


class TicketOut(TicketBase):
    id_ticket: int
    estado: str
    fecha_creacion: datetime
    fecha_resolucion: Optional[datetime]

    class Config:
        from_attributes = True
