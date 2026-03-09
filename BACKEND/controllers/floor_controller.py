from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.session import SessionLocal
from dtos.floor_dto import FloorCreate, FloorOut, FloorUpdate
from models.floor import Floor

router = APIRouter(prefix="/floors", tags=["floors"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=FloorOut, status_code=status.HTTP_201_CREATED)
def create_floor(floor: FloorCreate, db: Session = Depends(get_db)):
    db_floor = Floor(**floor.dict())
    db.add(db_floor)
    db.commit()
    db.refresh(db_floor)
    return db_floor


@router.get("/", response_model=list[FloorOut])
def list_floors(db: Session = Depends(get_db)):
    return db.query(Floor).all()


@router.get("/{floor_id}", response_model=FloorOut)
def get_floor(floor_id: int, db: Session = Depends(get_db)):
    floor = db.query(Floor).filter(Floor.id_floor == floor_id).first()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")
    return floor


@router.put("/{floor_id}", response_model=FloorOut)
def update_floor(floor_id: int, floor: FloorUpdate, db: Session = Depends(get_db)):
    db_floor = db.query(Floor).filter(Floor.id_floor == floor_id).first()
    if not db_floor:
        raise HTTPException(status_code=404, detail="Floor not found")
    
    for key, value in floor.dict(exclude_unset=True).items():
        setattr(db_floor, key, value)
    
    db.add(db_floor)
    db.commit()
    db.refresh(db_floor)
    return db_floor


@router.delete("/{floor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_floor(floor_id: int, db: Session = Depends(get_db)):
    db_floor = db.query(Floor).filter(Floor.id_floor == floor_id).first()
    if not db_floor:
        raise HTTPException(status_code=404, detail="Floor not found")
    
    db.delete(db_floor)
    db.commit()
    return None
