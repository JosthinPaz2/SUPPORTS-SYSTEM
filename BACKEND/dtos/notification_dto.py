from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class NotificationBase(BaseModel):
    id_user: int
    message: str
    action_type: Optional[str] = None
    severity: Optional[str] = None
    id_ticket: Optional[int] = None
    id_station: Optional[str] = None
    read: Optional[bool] = False


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    message: Optional[str] = None
    read: Optional[bool] = None


class NotificationOut(NotificationBase):
    id_notification: int
    sent_at: datetime

    class Config:
        from_attributes = True
