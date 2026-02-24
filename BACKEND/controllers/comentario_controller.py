from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.session import SessionLocal
from dtos.comentario_dto import ComentarioCreate, ComentarioOut, ComentarioUpdate
from models.comentarios import Comentario

router = APIRouter(prefix="/comentarios", tags=["comentarios"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=ComentarioOut, status_code=status.HTTP_201_CREATED)
def crear_comentario(comentario: ComentarioCreate, db: Session = Depends(get_db)):
    db_comentario = Comentario(**comentario.dict())
    db.add(db_comentario)
    db.commit()
    db.refresh(db_comentario)
    return db_comentario


@router.get("/", response_model=list[ComentarioOut])
def listar_comentarios(db: Session = Depends(get_db)):
    comentarios = db.query(Comentario).all()
    return comentarios


@router.get("/{comentario_id}", response_model=ComentarioOut)
def obtener_comentario(comentario_id: int, db: Session = Depends(get_db)):
    comentario = db.query(Comentario).filter(Comentario.id_comentario == comentario_id).first()
    if not comentario:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    return comentario


@router.get("/ticket/{ticket_id}", response_model=list[ComentarioOut])
def listar_comentarios_por_ticket(ticket_id: int, db: Session = Depends(get_db)):
    comentarios = db.query(Comentario).filter(Comentario.id_ticket == ticket_id).all()
    if not comentarios:
        raise HTTPException(status_code=404, detail="No hay comentarios para este ticket")
    return comentarios


@router.put("/{comentario_id}", response_model=ComentarioOut)
def actualizar_comentario(comentario_id: int, comentario: ComentarioUpdate, db: Session = Depends(get_db)):
    db_comentario = db.query(Comentario).filter(Comentario.id_comentario == comentario_id).first()
    if not db_comentario:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    
    for key, value in comentario.dict(exclude_unset=True).items():
        setattr(db_comentario, key, value)
    
    db.add(db_comentario)
    db.commit()
    db.refresh(db_comentario)
    return db_comentario


@router.delete("/{comentario_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_comentario(comentario_id: int, db: Session = Depends(get_db)):
    db_comentario = db.query(Comentario).filter(Comentario.id_comentario == comentario_id).first()
    if not db_comentario:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    
    db.delete(db_comentario)
    db.commit()
    return None
