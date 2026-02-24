from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class ComentarioBase(BaseModel):
    id_ticket: int
    id_usuario: int
    contenido: str
    es_nota_interna: Optional[bool] = False
    evidencia_url: Optional[str] = None


class ComentarioCreate(ComentarioBase):
    pass


class ComentarioUpdate(BaseModel):
    contenido: Optional[str] = None
    es_nota_interna: Optional[bool] = None
    evidencia_url: Optional[str] = None


class ComentarioOut(ComentarioBase):
    id_comentario: int
    fecha_registro: datetime

    class Config:
        from_attributes = True
