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


class InternalNoteOut(BaseModel):
    id_comment: int
    id_user: int
    content: str
    created_at: datetime


class ChangeHistoryDetailOut(ChangeHistoryOut):
    ticket_title: Optional[str] = None
    ticket_description: Optional[str] = None
    ticket_priority: Optional[str] = None
    ticket_status: Optional[str] = None
    ticket_station: Optional[str] = None
    ticket_created_at: Optional[datetime] = None
    ticket_resolved_at: Optional[datetime] = None
    reported_by: Optional[int] = None
    internal_notes: list[InternalNoteOut] = []
