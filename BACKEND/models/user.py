from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    TIMESTAMP,
    func,
)
from sqlalchemy.orm import relationship
from datetime import datetime

from db import Base


class User(Base):
    __tablename__ = "users"
    id_user = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    institutional_email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    id_role = Column(Integer, ForeignKey("roles.id_role"), nullable=False)
    campaign = Column(String(50), nullable=True)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    
    # Password recovery fields
    recovery_code = Column(String(6), nullable=True)
    recovery_code_expiration = Column(TIMESTAMP, nullable=True)
    
    # Login attempt tracking for security
    failed_login_attempts = Column(Integer, default=0)
    last_failed_login = Column(TIMESTAMP, nullable=True)
    locked_until = Column(TIMESTAMP, nullable=True)
    
    # Relationships
    role = relationship("Role", back_populates="users")
    tickets_created = relationship("Ticket", foreign_keys="Ticket.created_by", back_populates="creator")
    tickets_assigned = relationship("Ticket", foreign_keys="Ticket.primary_technician", back_populates="primary_tech")
    comments = relationship("Comment", back_populates="user")
    notifications = relationship("Notification", back_populates="user")