from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.session import SessionLocal
from dtos.notificacion_dto import NotificacionCreate, NotificacionOut, NotificacionUpdate
from models.notificaciones import Notificacion

router = APIRouter(prefix="/notificaciones", tags=["notificaciones"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=NotificacionOut, status_code=status.HTTP_201_CREATED)
def crear_notificacion(notificacion: NotificacionCreate, db: Session = Depends(get_db)):
    db_notificacion = Notificacion(**notificacion.dict())
    db.add(db_notificacion)
    db.commit()
    db.refresh(db_notificacion)
    return db_notificacion


@router.get("/", response_model=list[NotificacionOut])
def listar_notificaciones(db: Session = Depends(get_db)):
    notificaciones = db.query(Notificacion).all()
    return notificaciones


@router.get("/{notificacion_id}", response_model=NotificacionOut)
def obtener_notificacion(notificacion_id: int, db: Session = Depends(get_db)):
    notificacion = db.query(Notificacion).filter(Notificacion.id_notificacion == notificacion_id).first()
    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    return notificacion


@router.get("/usuario/{usuario_id}", response_model=list[NotificacionOut])
def listar_notificaciones_por_usuario(usuario_id: int, db: Session = Depends(get_db)):
    notificaciones = db.query(Notificacion).filter(Notificacion.id_usuario == usuario_id).all()
    if not notificaciones:
        raise HTTPException(status_code=404, detail="No hay notificaciones para este usuario")
    return notificaciones


@router.put("/{notificacion_id}", response_model=NotificacionOut)
def actualizar_notificacion(notificacion_id: int, notificacion: NotificacionUpdate, db: Session = Depends(get_db)):
    db_notificacion = db.query(Notificacion).filter(Notificacion.id_notificacion == notificacion_id).first()
    if not db_notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    for key, value in notificacion.dict(exclude_unset=True).items():
        setattr(db_notificacion, key, value)
    
    db.add(db_notificacion)
    db.commit()
    db.refresh(db_notificacion)
    return db_notificacion


@router.delete("/{notificacion_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_notificacion(notificacion_id: int, db: Session = Depends(get_db)):
    db_notificacion = db.query(Notificacion).filter(Notificacion.id_notificacion == notificacion_id).first()
    if not db_notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    db.delete(db_notificacion)
    db.commit()
    return None
