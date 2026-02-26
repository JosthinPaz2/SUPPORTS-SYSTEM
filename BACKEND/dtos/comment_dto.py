from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class CommentBase(BaseModel):
    id_ticket: int
    id_user: int
    content: str
    internal_note: Optional[bool] = False
    evidence_url: Optional[str] = None


class CommentCreate(CommentBase):
    pass


class CommentUpdate(BaseModel):
    content: Optional[str] = None
    internal_note: Optional[bool] = None
    evidence_url: Optional[str] = None


class CommentOut(CommentBase):
    id_comment: int
    created_at: datetime

    class Config:
        from_attributes = True
