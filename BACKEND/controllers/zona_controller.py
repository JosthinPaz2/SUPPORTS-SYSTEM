from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.session import SessionLocal
from dtos.zona_dto import ZonaCreate, ZonaOut, ZonaUpdate
from models.zonas import Zona

router = APIRouter(prefix="/zonas", tags=["zonas"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=ZonaOut, status_code=status.HTTP_201_CREATED)
def crear_zona(zona: ZonaCreate, db: Session = Depends(get_db)):
    db_zona = Zona(**zona.dict())
    db.add(db_zona)
    db.commit()
    db.refresh(db_zona)
    return db_zona


@router.get("/", response_model=list[ZonaOut])
def listar_zonas(db: Session = Depends(get_db)):
    zonas = db.query(Zona).all()
    return zonas


@router.get("/{zona_id}", response_model=ZonaOut)
def obtener_zona(zona_id: int, db: Session = Depends(get_db)):
    zona = db.query(Zona).filter(Zona.id_zona == zona_id).first()
    if not zona:
        raise HTTPException(status_code=404, detail="Zona no encontrada")
    return zona


@router.put("/{zona_id}", response_model=ZonaOut)
def actualizar_zona(zona_id: int, zona: ZonaUpdate, db: Session = Depends(get_db)):
    db_zona = db.query(Zona).filter(Zona.id_zona == zona_id).first()
    if not db_zona:
        raise HTTPException(status_code=404, detail="Zona no encontrada")
    
    for key, value in zona.dict(exclude_unset=True).items():
        setattr(db_zona, key, value)
    
    db.add(db_zona)
    db.commit()
    db.refresh(db_zona)
    return db_zona


@router.delete("/{zona_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_zona(zona_id: int, db: Session = Depends(get_db)):
    db_zona = db.query(Zona).filter(Zona.id_zona == zona_id).first()
    if not db_zona:
        raise HTTPException(status_code=404, detail="Zona no encontrada")
    
    db.delete(db_zona)
    db.commit()
    return None
