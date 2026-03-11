from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from db.session import SessionLocal
from dtos.ticket_dto import TicketCreate, TicketOut, TicketUpdate
from models.ticket import Ticket, EstadoTicket, Priority
from models.station import Station, EstadoEstacion
from models.change_history import ChangeHistory
from models.notification import Notification
from models.user import User

router = APIRouter(prefix="/tickets", tags=["tickets"])


_PRIORITY_RANK = {
    Priority.LOW: 1,
    Priority.MEDIUM: 2,
    Priority.HIGH: 3,
    Priority.URGENT: 4,
}


def _normalize_priority(value) -> Priority:
    if isinstance(value, Priority):
        return value

    normalized = str(value or "").strip().lower()
    if normalized == "urgent":
        return Priority.URGENT
    if normalized == "high":
        return Priority.HIGH
    if normalized == "medium":
        return Priority.MEDIUM
    return Priority.LOW


def _target_priority_for_open_ticket(created_at: Optional[datetime], active_count_for_station: int, now: datetime) -> Priority:
    if active_count_for_station >= 3:
        return Priority.URGENT

    if not created_at:
        return Priority.LOW

    age = now - created_at
    if age >= timedelta(days=2):
        return Priority.URGENT
    if age >= timedelta(days=1):
        return Priority.HIGH
    if age >= timedelta(hours=2):
        return Priority.MEDIUM
    return Priority.LOW


def _normalize_status(value) -> str:
    if value is None:
        return ""

    if hasattr(value, "value"):
        value = value.value

    normalized = str(value).strip().lower().replace("_", " ")
    if normalized in {"in progress", "in-progress"}:
        return "in progress"
    if normalized == "resolved":
        return "resolved"
    return "pending"


def _refresh_open_ticket_priorities(db: Session) -> bool:
    """Escalate open ticket priorities automatically based on age and station workload."""
    open_tickets = db.query(Ticket).filter(Ticket.status != EstadoTicket.RESOLVED).all()

    active_by_station: dict[str, int] = {}
    for open_ticket in open_tickets:
        if open_ticket.id_station:
            active_by_station[open_ticket.id_station] = active_by_station.get(open_ticket.id_station, 0) + 1

    now = datetime.utcnow()
    changed = False

    for open_ticket in open_tickets:
        station_active_count = active_by_station.get(open_ticket.id_station, 0) if open_ticket.id_station else 0
        target = _target_priority_for_open_ticket(open_ticket.created_at, station_active_count, now)
        current = _normalize_priority(open_ticket.priority)

        # Never downgrade automatically; only escalate.
        effective = target if _PRIORITY_RANK[target] > _PRIORITY_RANK[current] else current
        if effective != current:
            open_ticket.priority = effective
            changed = True

    return changed


def _get_role_one_user_ids(db: Session) -> set[int]:
    rows = db.query(User.id_user).filter(User.id_role == 1).all()
    return {int(row[0]) for row in rows}


def _create_notifications(
    db: Session,
    user_ids: set[int],
    message: str,
    *,
    exclude_user_id: Optional[int] = None,
    action_type: Optional[str] = None,
    severity: Optional[str] = None,
    id_ticket: Optional[int] = None,
    id_station: Optional[str] = None,
):
    for user_id in user_ids:
        if exclude_user_id is not None and user_id == exclude_user_id:
            continue
        db.add(Notification(
            id_user=user_id,
            message=message,
            action_type=action_type,
            severity=severity,
            id_ticket=id_ticket,
            id_station=id_station,
            read=False,
        ))


def _get_user_display_name(db: Session, user_id: Optional[int]) -> str:
    if not user_id:
        return "Sistema"
    user = db.query(User).filter(User.id_user == user_id).first()
    return user.full_name if user and user.full_name else f"Usuario #{user_id}"


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db)):
    if ticket.id_station:
        active_reports = db.query(Ticket).filter(
            Ticket.id_station == ticket.id_station,
            Ticket.status != EstadoTicket.RESOLVED,
        ).count()

        if active_reports >= 3:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This station is blocked: it already has 3 active reports",
            )

    db_ticket = Ticket(**ticket.dict())
    db.add(db_ticket)
    db.flush()

    # Auto-update station status to Not Available when a ticket is reported
    if db_ticket.id_station:
        station = db.query(Station).filter(Station.id_station == db_ticket.id_station).first()
        if station:
            station.current_status = EstadoEstacion.NO_DISPONIBLE

    role_one_user_ids = _get_role_one_user_ids(db)
    _create_notifications(
        db,
        role_one_user_ids,
        f"New ticket #{db_ticket.id_ticket} created: {db_ticket.title}",
        exclude_user_id=db_ticket.created_by,
        action_type="ticket-created",
        severity="info",
        id_ticket=db_ticket.id_ticket,
        id_station=db_ticket.id_station,
    )

    if db_ticket.id_station:
        active_reports_after_create = db.query(Ticket).filter(
            Ticket.id_station == db_ticket.id_station,
            Ticket.status != EstadoTicket.RESOLVED,
        ).count()

        if active_reports_after_create == 3:
            _create_notifications(
                db,
                role_one_user_ids,
                f"URGENT: Station {db_ticket.id_station} has reached 3 active reports. Open ticket #{db_ticket.id_ticket}: {db_ticket.title}",
                exclude_user_id=db_ticket.created_by,
                action_type="station-threshold",
                severity="critical",
                id_ticket=db_ticket.id_ticket,
                id_station=db_ticket.id_station,
            )

    _refresh_open_ticket_priorities(db)

    db.commit()
    db.refresh(db_ticket)
    return db_ticket


@router.get("/", response_model=list[TicketOut])
def list_tickets(db: Session = Depends(get_db)):
    if _refresh_open_ticket_priorities(db):
        db.commit()
    return db.query(Ticket).all()


@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    if _refresh_open_ticket_priorities(db):
        db.commit()

    ticket = db.query(Ticket).filter(Ticket.id_ticket == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.put("/{ticket_id}", response_model=TicketOut)
def update_ticket(ticket_id: int, ticket: TicketUpdate, db: Session = Depends(get_db)):
    db_ticket = db.query(Ticket).filter(Ticket.id_ticket == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    previous_status = _normalize_status(db_ticket.status)
    previous_primary = db_ticket.primary_technician
    previous_secondary = db_ticket.secondary_technician
    actor_user = ticket.moved_by or db_ticket.moved_by or db_ticket.created_by

    for key, value in ticket.dict(exclude_unset=True).items():
        setattr(db_ticket, key, value)

    db.add(db_ticket)
    db.flush()

    normalized_status = _normalize_status(ticket.status) if ticket.status else previous_status

    role_one_user_ids = _get_role_one_user_ids(db)

    if ticket.status and normalized_status != previous_status:
        db.add(ChangeHistory(
            id_ticket=db_ticket.id_ticket,
            action_user=actor_user,
            change_description=f"Status changed from {previous_status.title()} to {normalized_status.title()}",
        ))

        status_recipients = {
            db_ticket.created_by,
            *(role_one_user_ids),
        }

        if db_ticket.primary_technician:
            status_recipients.add(db_ticket.primary_technician)
        if db_ticket.secondary_technician:
            status_recipients.add(db_ticket.secondary_technician)

        _create_notifications(
            db,
            status_recipients,
            f"Ticket #{db_ticket.id_ticket} changed to {normalized_status.title()}",
            exclude_user_id=actor_user,
            action_type="status-change",
            severity="info",
            id_ticket=db_ticket.id_ticket,
            id_station=db_ticket.id_station,
        )

    if (ticket.primary_technician is not None or ticket.secondary_technician is not None):
        assignment_actor_user = ticket.moved_by if ticket.moved_by else None
        assigned_by_name = _get_user_display_name(db, assignment_actor_user)
        assignment_message = (
            f"{assigned_by_name} assigned you to ticket #{db_ticket.id_ticket}: {db_ticket.title}"
        )

        if db_ticket.primary_technician and db_ticket.primary_technician != previous_primary:
            _create_notifications(
                db,
                {db_ticket.primary_technician},
                assignment_message,
                action_type="assignment",
                severity="info",
                id_ticket=db_ticket.id_ticket,
                id_station=db_ticket.id_station,
            )

        if db_ticket.secondary_technician and db_ticket.secondary_technician != previous_secondary:
            _create_notifications(
                db,
                {db_ticket.secondary_technician},
                assignment_message,
                action_type="assignment",
                severity="info",
                id_ticket=db_ticket.id_ticket,
                id_station=db_ticket.id_station,
            )

        assignment_audit_recipients = set(role_one_user_ids)
        _create_notifications(
            db,
            assignment_audit_recipients,
            f"Ticket #{db_ticket.id_ticket} technician assignment was updated",
            exclude_user_id=assignment_actor_user,
            action_type="assignment-audit",
            severity="info",
            id_ticket=db_ticket.id_ticket,
            id_station=db_ticket.id_station,
        )

    # Auto-log change history when ticket is resolved
    if normalized_status == "resolved" and previous_status != "resolved":
        action_user = actor_user
        db.add(ChangeHistory(
            id_ticket=db_ticket.id_ticket,
            action_user=action_user,
            change_description=f"Ticket resolved: {db_ticket.title}",
        ))

    # When a ticket is resolved, restore station only if no more active tickets remain.
    if normalized_status == "resolved" and db_ticket.id_station:
        remaining_active = db.query(Ticket).filter(
            Ticket.id_station == db_ticket.id_station,
            Ticket.status != EstadoTicket.RESOLVED,
            Ticket.id_ticket != db_ticket.id_ticket,
        ).count()

        station = db.query(Station).filter(Station.id_station == db_ticket.id_station).first()
        if station:
            station.current_status = (
                EstadoEstacion.DISPONIBLE if remaining_active == 0 else EstadoEstacion.NO_DISPONIBLE
            )

    _refresh_open_ticket_priorities(db)

    db.commit()
    db.refresh(db_ticket)
    return db_ticket


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)):
    db_ticket = db.query(Ticket).filter(Ticket.id_ticket == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    station_id = db_ticket.id_station
    
    db.delete(db_ticket)

    if station_id:
        remaining_active = db.query(Ticket).filter(
            Ticket.id_station == station_id,
            Ticket.status != EstadoTicket.RESOLVED,
            Ticket.id_ticket != ticket_id,
        ).count()

        station = db.query(Station).filter(Station.id_station == station_id).first()
        if station:
            station.current_status = (
                EstadoEstacion.DISPONIBLE if remaining_active == 0 else EstadoEstacion.NO_DISPONIBLE
            )

    _refresh_open_ticket_priorities(db)

    db.commit()
    return None
