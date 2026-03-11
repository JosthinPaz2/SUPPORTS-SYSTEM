from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, TIMESTAMP, func
from sqlalchemy.orm import relationship

from db import Base


class Notification(Base):
    __tablename__ = "notifications"
    id_notification = Column(Integer, primary_key=True, autoincrement=True)
    id_user = Column(Integer, ForeignKey("users.id_user"), nullable=False)
    message = Column(Text)
    action_type = Column(String(50), nullable=True)
    severity = Column(String(20), nullable=True)
    id_ticket = Column(Integer, ForeignKey("tickets.id_ticket"), nullable=True)
    id_station = Column(String(20), ForeignKey("stations.id_station"), nullable=True)
    read = Column(Boolean, default=False)
    sent_at = Column(TIMESTAMP, default=func.current_timestamp())
    
    # Relationships
    user = relationship("User", back_populates="notifications")
