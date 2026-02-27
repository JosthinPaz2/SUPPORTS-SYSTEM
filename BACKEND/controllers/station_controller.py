from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from db.session import SessionLocal
from dtos.station_dto import StationCreate, StationOut, StationUpdate
from models.station import Station

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/stations", tags=["stations"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=StationOut, status_code=status.HTTP_201_CREATED)
def create_station(station: StationCreate, db: Session = Depends(get_db)):
    db_station = Station(**station.dict())
    db.add(db_station)
    db.commit()
    db.refresh(db_station)
    logger.info(f"created station {db_station.id_station}")
    return db_station


@router.get("/", response_model=list[StationOut])
def list_stations(db: Session = Depends(get_db)):
    return db.query(Station).all()


@router.get("/{station_id}", response_model=StationOut)
def get_station(station_id: str, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id_station == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    return station


@router.put("/{station_id}", response_model=StationOut)
def update_station(station_id: str, station: StationUpdate, db: Session = Depends(get_db)):
    db_station = db.query(Station).filter(Station.id_station == station_id).first()
    if not db_station:
        raise HTTPException(status_code=404, detail="Station not found")
    
    for key, value in station.dict(exclude_unset=True).items():
        setattr(db_station, key, value)
    
    db.add(db_station)
    db.commit()
    db.refresh(db_station)
    logger.info(f"updated station {db_station.id_station}")
    return db_station


@router.delete("/{station_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_station(station_id: str, db: Session = Depends(get_db)):
    db_station = db.query(Station).filter(Station.id_station == station_id).first()
    if not db_station:
        raise HTTPException(status_code=404, detail="Station not found")
    
    db.delete(db_station)
    db.commit()
    logger.info(f"deleted station {station_id}")
    return None
