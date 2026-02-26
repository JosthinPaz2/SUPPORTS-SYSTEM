from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship

from db import Base


class ChangeHistory(Base):
    __tablename__ = "changes_history"
    id_change = Column(Integer, primary_key=True, autoincrement=True)
    id_ticket = Column(Integer, ForeignKey("tickets.id_ticket"), nullable=False)
    action_user = Column(Integer, ForeignKey("users.id_user"), nullable=False)
    change_description = Column(String(255))
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    
    # Relationships
    ticket = relationship("Ticket", back_populates="changes")
    user = relationship("User")
