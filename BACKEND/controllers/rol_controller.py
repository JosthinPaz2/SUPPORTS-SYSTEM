from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from db.session import SessionLocal
from dtos.rol_dto import RolCreate, RolOut, RolUpdate
from models.roles import Rol

router = APIRouter(prefix="/roles", tags=["roles"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=RolOut, status_code=status.HTTP_201_CREATED)
def crear_rol(rol: RolCreate, db: Session = Depends(get_db)):
    # Verificar duplicado por nombre
    existente = db.query(Rol).filter(Rol.nombre_rol == rol.nombre_rol).first()
    if existente:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El rol ya existe")

    db_rol = Rol(**rol.dict())
    db.add(db_rol)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El rol ya existe (constraint)")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al crear el rol")

    db.refresh(db_rol)
    return db_rol

@router.get("/", response_model=list[RolOut])
def listar_roles(db: Session = Depends(get_db)):
    return db.query(Rol).all()

@router.get("/{rol_id}", response_model=RolOut)
def obtener_rol(rol_id: int, db: Session = Depends(get_db)):
    rol = db.get(Rol, rol_id)
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return rol

@router.put("/{rol_id}", response_model=RolOut)
def actualizar_rol(rol_id: int, datos: RolUpdate, db: Session = Depends(get_db)):
    rol = db.get(Rol, rol_id)
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    
    for key, value in datos.dict(exclude_unset=True).items():
        setattr(rol, key, value)
        
    db.commit()
    db.refresh(rol)
    return rol

@router.delete("/{rol_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_rol(rol_id: int, db: Session = Depends(get_db)):
    rol = db.get(Rol, rol_id)
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    
    db.delete(rol)
    db.commit()
    return None