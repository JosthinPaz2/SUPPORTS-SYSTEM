from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime

from db.session import SessionLocal
from dtos.change_history_dto import (
    ChangeHistoryCreate, ChangeHistoryOut, ChangeHistoryUpdate, ChangeHistoryDetailOut, InternalNoteOut
)
from models.change_history import ChangeHistory
from models.ticket import Ticket

router = APIRouter(prefix="/changes", tags=["changes_history"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=ChangeHistoryOut, status_code=status.HTTP_201_CREATED)
def create_change(change: ChangeHistoryCreate, db: Session = Depends(get_db)):
    db_change = ChangeHistory(**change.dict())
    db.add(db_change)
    db.commit()
    db.refresh(db_change)
    return db_change


@router.get("/", response_model=list[ChangeHistoryOut])
def list_changes(db: Session = Depends(get_db)):
    return db.query(ChangeHistory).all()


def _enrich(ch: ChangeHistory) -> ChangeHistoryDetailOut:
    t = ch.ticket
    internal_notes: list[InternalNoteOut] = []
    if t and t.comments:
        internal_notes = [
            InternalNoteOut(
                id_comment=c.id_comment,
                id_user=c.id_user,
                content=c.content,
                created_at=c.created_at,
            )
            for c in sorted(t.comments, key=lambda x: x.created_at or datetime.min, reverse=True)
            if bool(c.internal_note)
        ]
    return ChangeHistoryDetailOut(
        id_change=ch.id_change,
        id_ticket=ch.id_ticket,
        action_user=ch.action_user,
        change_description=ch.change_description,
        created_at=ch.created_at,
        ticket_title=t.title if t else None,
        ticket_description=t.description if t else None,
        ticket_priority=str(t.priority.value if hasattr(t.priority, "value") else t.priority) if t else None,
        ticket_status=str(t.status.value if hasattr(t.status, "value") else t.status) if t else None,
        ticket_station=t.id_station if t else None,
        ticket_created_at=t.created_at if t else None,
        ticket_resolved_at=t.resolved_at if t else None,
        reported_by=t.created_by if t else None,
        internal_notes=internal_notes,
    )


@router.get("/ticket/{ticket_id}", response_model=list[ChangeHistoryDetailOut])
def list_changes_by_ticket(ticket_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(ChangeHistory)
        .options(joinedload(ChangeHistory.ticket).joinedload(Ticket.comments))
        .filter(ChangeHistory.id_ticket == ticket_id)
        .order_by(ChangeHistory.created_at.desc())
        .all()
    )
    return [_enrich(r) for r in rows]


@router.get("/station/{station_id}", response_model=list[ChangeHistoryDetailOut])
def list_changes_by_station(station_id: str, db: Session = Depends(get_db)):
    """Return all change history entries for every ticket ever linked to a station."""
    rows = (
        db.query(ChangeHistory)
        .options(joinedload(ChangeHistory.ticket).joinedload(Ticket.comments))
        .join(Ticket, ChangeHistory.id_ticket == Ticket.id_ticket)
        .filter(Ticket.id_station == station_id)
        .order_by(ChangeHistory.created_at.desc())
        .all()
    )
    return [_enrich(r) for r in rows]


@router.get("/{change_id}", response_model=ChangeHistoryOut)
def get_change(change_id: int, db: Session = Depends(get_db)):
    ch = db.query(ChangeHistory).filter(ChangeHistory.id_change == change_id).first()
    if not ch:
        raise HTTPException(status_code=404, detail="Change not found")
    return ch


@router.put("/{change_id}", response_model=ChangeHistoryOut)
def update_change(change_id: int, change: ChangeHistoryUpdate, db: Session = Depends(get_db)):
    db_ch = db.query(ChangeHistory).filter(ChangeHistory.id_change == change_id).first()
    if not db_ch:
        raise HTTPException(status_code=404, detail="Change not found")
    for key, value in change.dict(exclude_unset=True).items():
        setattr(db_ch, key, value)
    db.add(db_ch)
    db.commit()
    db.refresh(db_ch)
    return db_ch


@router.delete("/{change_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_change(change_id: int, db: Session = Depends(get_db)):
    db_ch = db.query(ChangeHistory).filter(ChangeHistory.id_change == change_id).first()
    if not db_ch:
        raise HTTPException(status_code=404, detail="Change not found")
    db.delete(db_ch)
    db.commit()
    return None
