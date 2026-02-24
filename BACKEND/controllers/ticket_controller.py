from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.session import SessionLocal
from dtos.ticket_dto import TicketCreate, TicketOut, TicketUpdate
from models.tickets import Ticket

router = APIRouter(prefix="/tickets", tags=["tickets"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def crear_ticket(ticket: TicketCreate, db: Session = Depends(get_db)):
    db_ticket = Ticket(**ticket.dict())
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


@router.get("/", response_model=list[TicketOut])
def listar_tickets(db: Session = Depends(get_db)):
    tickets = db.query(Ticket).all()
    return tickets


@router.get("/{ticket_id}", response_model=TicketOut)
def obtener_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id_ticket == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return ticket


@router.put("/{ticket_id}", response_model=TicketOut)
def actualizar_ticket(ticket_id: int, ticket: TicketUpdate, db: Session = Depends(get_db)):
    db_ticket = db.query(Ticket).filter(Ticket.id_ticket == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    for key, value in ticket.dict(exclude_unset=True).items():
        setattr(db_ticket, key, value)
    
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_ticket(ticket_id: int, db: Session = Depends(get_db)):
    db_ticket = db.query(Ticket).filter(Ticket.id_ticket == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    db.delete(db_ticket)
    db.commit()
    return None
