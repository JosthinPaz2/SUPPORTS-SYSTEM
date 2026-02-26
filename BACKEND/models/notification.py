from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, TIMESTAMP, func
from sqlalchemy.orm import relationship

from db import Base


class Notification(Base):
    __tablename__ = "notifications"
    id_notification = Column(Integer, primary_key=True, autoincrement=True)
    id_user = Column(Integer, ForeignKey("users.id_user"), nullable=False)
    message = Column(Text)
    read = Column(Boolean, default=False)
    sent_at = Column(TIMESTAMP, default=func.current_timestamp())
    
    # Relationships
    user = relationship("User", back_populates="notifications")
