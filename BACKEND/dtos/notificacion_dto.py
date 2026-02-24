from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class NotificacionBase(BaseModel):
    id_usuario: int
    mensaje: str
    leida: Optional[bool] = False


class NotificacionCreate(NotificacionBase):
    pass


class NotificacionUpdate(BaseModel):
    mensaje: Optional[str] = None
    leida: Optional[bool] = None


class NotificacionOut(NotificacionBase):
    id_notificacion: int
    fecha_envio: datetime

    class Config:
        from_attributes = True
