from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, TIMESTAMP, func
from sqlalchemy.orm import relationship

from db import Base


class Comment(Base):
    __tablename__ = "comments"
    id_comment = Column(Integer, primary_key=True, autoincrement=True)
    id_ticket = Column(Integer, ForeignKey("tickets.id_ticket"), nullable=False)
    id_user = Column(Integer, ForeignKey("users.id_user"), nullable=False)
    content = Column(Text, nullable=False)
    internal_note = Column(Boolean, default=False)
    evidence_url = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    
    # Relationships
    ticket = relationship("Ticket", back_populates="comments")
    user = relationship("User", back_populates="comments")
