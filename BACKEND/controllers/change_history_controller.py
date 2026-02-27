from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.session import SessionLocal
from dtos.change_history_dto import (
    ChangeHistoryCreate, ChangeHistoryOut, ChangeHistoryUpdate
)
from models.change_history import ChangeHistory

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
