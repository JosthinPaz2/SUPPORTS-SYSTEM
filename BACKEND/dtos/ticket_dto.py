from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class TicketBase(BaseModel):
    title: str
    description: str
    priority: Optional[str] = "Low"
    id_category: int
    created_by: int
    primary_technician: Optional[int] = None
    secondary_technician: Optional[int] = None
    id_station: Optional[str] = None


class TicketCreate(TicketBase):
    category_detail: Optional[str] = None


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    id_category: Optional[int] = None
    primary_technician: Optional[int] = None
    secondary_technician: Optional[int] = None
    id_station: Optional[str] = None
    resolved_at: Optional[datetime] = None
    moved_by: Optional[int] = None
    category_detail: Optional[str] = None


class TicketOut(TicketBase):
    id_ticket: int
    status: str
    priority: str
    created_at: datetime
    resolved_at: Optional[datetime]
    category_detail: Optional[str] = None
    moved_by: Optional[int] = None

    class Config:
        from_attributes = True
