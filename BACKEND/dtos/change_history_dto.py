from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class ChangeHistoryBase(BaseModel):
    id_ticket: int
    action_user: int
    change_description: Optional[str] = None


class ChangeHistoryCreate(ChangeHistoryBase):
    pass


class ChangeHistoryUpdate(BaseModel):
    change_description: Optional[str] = None


class ChangeHistoryOut(ChangeHistoryBase):
    id_change: int
    created_at: datetime

    class Config:
        from_attributes = True
