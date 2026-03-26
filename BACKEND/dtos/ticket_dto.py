from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List
from .user_dto import UserOut
from .station_dto import StationOut
from .category_dto import CategoryOut

class TicketBase(BaseModel):
    title: str = Field(..., max_length=100)
    description: str
    id_category: int
    id_station: Optional[str] = None
    priority: Optional[str] = Field(None, pattern="^(LOW|MEDIUM|HIGH|URGENT|low|medium|high|urgent)$")
    category_detail: Optional[str] = None

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(PENDING|IN_PROGRESS|RESOLVED|pending|in-progress|in progress|resolved)$")
    priority: Optional[str] = Field(None, pattern="^(LOW|MEDIUM|HIGH|URGENT|low|medium|high|urgent)$")
    id_category: Optional[int] = None
    primary_technician: Optional[int] = None
    secondary_technician: Optional[int] = None
    id_station: Optional[str] = None
    category_detail: Optional[str] = None
    moved_by: Optional[int] = None  
    
    @field_validator('status', mode='before')
    @classmethod
    def normalize_status(cls, v):
        if not v:
            return v
        mapping = {
            'pending': 'PENDING',
            'in-progress': 'IN_PROGRESS',
            'in progress': 'IN_PROGRESS',
            'resolved': 'RESOLVED',
        }
        return mapping.get(str(v).lower(), str(v).upper())
    
    @field_validator('priority', mode='before')
    @classmethod
    def normalize_priority(cls, v):
        if not v:
            return v
        return str(v).upper()

class TicketOut(BaseModel):
    id_ticket: int
    title: str
    description: str
    status: Optional[str] = None
    priority: Optional[str] = None
    id_category: int
    created_by: int
    primary_technician: Optional[int] = None
    secondary_technician: Optional[int] = None
    id_station: Optional[str] = None
    created_at: Optional[datetime] = None
    last_updated: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    category_detail: Optional[str] = None
    moved_by: Optional[int] = None
    
    category: Optional[CategoryOut] = None
    creator: Optional[UserOut] = None
    station: Optional[StationOut] = None
    primary_tech: Optional[UserOut] = None
    secondary_tech: Optional[UserOut] = None
    
    class Config:
        from_attributes = True
        populate_by_name = True