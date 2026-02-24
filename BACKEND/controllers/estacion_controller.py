from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.session import SessionLocal
from dtos.estacion_dto import EstacionCreate, EstacionOut, EstacionUpdate
from models.estaciones import Estacion

router = APIRouter(prefix="/estaciones", tags=["estaciones"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=EstacionOut, status_code=status.HTTP_201_CREATED)
def crear_estacion(estacion: EstacionCreate, db: Session = Depends(get_db)):
    db_estacion = Estacion(**estacion.dict())
    db.add(db_estacion)
    db.commit()
    db.refresh(db_estacion)
    return db_estacion


@router.get("/", response_model=list[EstacionOut])
def listar_estaciones(db: Session = Depends(get_db)):
    estaciones = db.query(Estacion).all()
    return estaciones


@router.get("/{estacion_id}", response_model=EstacionOut)
def obtener_estacion(estacion_id: str, db: Session = Depends(get_db)):
    estacion = db.query(Estacion).filter(Estacion.id_estacion == estacion_id).first()
    if not estacion:
        raise HTTPException(status_code=404, detail="Estación no encontrada")
    return estacion


@router.put("/{estacion_id}", response_model=EstacionOut)
def actualizar_estacion(estacion_id: str, estacion: EstacionUpdate, db: Session = Depends(get_db)):
    db_estacion = db.query(Estacion).filter(Estacion.id_estacion == estacion_id).first()
    if not db_estacion:
        raise HTTPException(status_code=404, detail="Estación no encontrada")
    
    for key, value in estacion.dict(exclude_unset=True).items():
        setattr(db_estacion, key, value)
    
    db.add(db_estacion)
    db.commit()
    db.refresh(db_estacion)
    return db_estacion


@router.delete("/{estacion_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_estacion(estacion_id: str, db: Session = Depends(get_db)):
    db_estacion = db.query(Estacion).filter(Estacion.id_estacion == estacion_id).first()
    if not db_estacion:
        raise HTTPException(status_code=404, detail="Estación no encontrada")
    
    db.delete(db_estacion)
    db.commit()
    return None
