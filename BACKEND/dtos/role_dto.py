from typing import Optional
from pydantic import BaseModel


class RoleBase(BaseModel):
    role_name: str


class RoleCreate(RoleBase):
    pass


class RoleUpdate(RoleBase):
    pass


class RoleOut(RoleBase):
    id_role: int

    class Config:
        from_attributes = True
