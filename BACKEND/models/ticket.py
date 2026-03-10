from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, TIMESTAMP, func
from sqlalchemy.orm import relationship
import enum

from db import Base


class EstadoTicket(str, enum.Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"


class Priority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    URGENT = "Urgent"


class Ticket(Base):
    __tablename__ = "tickets"
    id_ticket = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(EstadoTicket), default=EstadoTicket.PENDING)
    priority = Column(Enum(Priority), default=Priority.LOW)
    id_category = Column(Integer, ForeignKey("categories.id_category"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id_user"), nullable=False)
    primary_technician = Column(Integer, ForeignKey("users.id_user"), nullable=True)
    secondary_technician = Column(Integer, ForeignKey("users.id_user"), nullable=True)
    id_station = Column(String(20), ForeignKey("stations.id_station"), nullable=True)
    created_at = Column(TIMESTAMP, default=func.current_timestamp())
    last_updated = Column(TIMESTAMP, default=func.current_timestamp(), onupdate=func.current_timestamp())
    resolved_at = Column(TIMESTAMP, nullable=True)
    category_detail = Column(Text, nullable=True)
    moved_by = Column(Integer, ForeignKey("users.id_user"), nullable=True)

    # Relationships
    category = relationship("Category", back_populates="tickets")
    creator = relationship("User", foreign_keys=[created_by], back_populates="tickets_created")
    primary_tech = relationship("User", foreign_keys=[primary_technician], back_populates="tickets_assigned")
    secondary_tech = relationship("User", foreign_keys=[secondary_technician], back_populates="tickets_assigned")
    moved_by_user = relationship("User", foreign_keys=[moved_by])
    station = relationship("Station", back_populates="tickets")
    comments = relationship("Comment", back_populates="ticket")
    changes = relationship("ChangeHistory", back_populates="ticket")
