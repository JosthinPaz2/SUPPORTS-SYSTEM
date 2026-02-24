from typing import Optional
from pydantic import BaseModel


class CategoriaBase(BaseModel):
    nombre_categoria: str


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaUpdate(CategoriaBase):
    pass


class CategoriaOut(CategoriaBase):
    id_categoria: int

    class Config:
        from_attributes = True
