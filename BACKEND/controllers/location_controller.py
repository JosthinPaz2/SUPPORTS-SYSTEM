from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.session import SessionLocal
from dtos.location_dto import LocationCreate, LocationOut, LocationUpdate
from models.location import Location

router = APIRouter(prefix="/locations", tags=["locations"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=LocationOut, status_code=status.HTTP_201_CREATED)
def create_location(location: LocationCreate, db: Session = Depends(get_db)):
    db_loc = Location(**location.dict())
    db.add(db_loc)
    db.commit()
    db.refresh(db_loc)
    return db_loc


@router.get("/", response_model=list[LocationOut])
def list_locations(db: Session = Depends(get_db)):
    return db.query(Location).all()


@router.get("/{location_id}", response_model=LocationOut)
def get_location(location_id: int, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id_location == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    return loc


@router.put("/{location_id}", response_model=LocationOut)
def update_location(location_id: int, location: LocationUpdate, db: Session = Depends(get_db)):
    db_loc = db.query(Location).filter(Location.id_location == location_id).first()
    if not db_loc:
        raise HTTPException(status_code=404, detail="Location not found")
    for key, value in location.dict(exclude_unset=True).items():
        setattr(db_loc, key, value)
    db.add(db_loc)
    db.commit()
    db.refresh(db_loc)
    return db_loc


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(location_id: int, db: Session = Depends(get_db)):
    db_loc = db.query(Location).filter(Location.id_location == location_id).first()
    if not db_loc:
        raise HTTPException(status_code=404, detail="Location not found")
    db.delete(db_loc)
    db.commit()
    return None
