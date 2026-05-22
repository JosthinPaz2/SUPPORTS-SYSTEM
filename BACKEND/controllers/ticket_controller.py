from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import re
import requests
import os
import logging
import json

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from db.session import SessionLocal
from dtos.ticket_dto import TicketCreate, TicketOut, TicketUpdate
from models.ticket import Ticket, EstadoTicket, Priority
from models.station import Station, EstadoEstacion
from models.change_history import ChangeHistory
from models.notification import Notification
from models.user import User

router = APIRouter(prefix="/tickets", tags=["tickets"])
INVENTORY_API_URL = os.getenv('INVENTORY_API_URL', 'http://localhost:8000')
INVENTORY_API_KEY = os.getenv('INVENTORY_API_KEY', '')

_HARDWARE_COMPONENT_MAP = {
    "pantalla-derecha": "Right screen",
    "pantalla-izquierda": "Left screen",
    "teclado": "Keyboard ESENSES Basic USB",
    "mouse": "Wired HP optical mouse black 100",
    "cpu": "CPU",
    "cable-vga": "DisplayPort to VGA cable",
    "cable-vga-vga": "VGA to VGA cable",
    "extension": "Power cable extension",
    "cable-hdmi": "HDMI to HDMI cable",
    "cable-vga-hdmi": "VGA to HDMI cable",
    "conversor-vga": "DisplayPort to VGA adapter",
    "ethernet": "Ethernet 3.0 LAN to USB",
    "ethernet-usb-2": "Ethernet USB 2.0",
    "ethernet-usb": "Ethernet USB",
}

_ASSET_STATUS_LABELS = {
    "repair": "Needs Repair",
    "replace": "Needs Replacement",
    "tested": "Operational",
    "maintenance": "Missing",
    "missing": "Missing",
    "damage": "Damage",
    "return": "Return",
}

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
        db.add(
            Notification(
                id_user=user_id,
                message=message,
                read=False,
                action_type=action_type,
                severity=severity,
                id_ticket=id_ticket,
                id_station=id_station,
            )
        )


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


def _parse_category_detail(detail: Optional[str]) -> dict:
    if not detail:
        return {}
    detail = detail.strip()
    if not detail:
        return {}
    if detail.startswith('{') and detail.endswith('}'):
        try:
            return json.loads(detail)
        except json.JSONDecodeError:
            pass
    result = {}
    for part in detail.split(';'):
        part = part.strip()
        if ':' in part:
            k, v = part.split(':', 1)
            result[k.strip()] = v.strip()
    return result


def _get_asset_item_from_ticket(ticket: Ticket) -> Optional[str]:
    parsed = _parse_category_detail(ticket.category_detail)
    component_key = parsed.get('hardware_component')
    if component_key:
        return _HARDWARE_COMPONENT_MAP.get(component_key)
    return None


def _build_hardware_description(base_description: Optional[str], component_key: str, asset_status: Optional[str] = None) -> str:
    device_type_label = _HARDWARE_COMPONENT_MAP.get(component_key, component_key)
    block_lines = [
        'DAMAGE SPECIFICATION',
        f'- Device Type: {device_type_label}',
    ]

    if asset_status:
        asset_status_label = _ASSET_STATUS_LABELS.get(asset_status.strip().lower(), asset_status)
        block_lines.append(f'- Asset Condition: {asset_status_label}')

    hardware_block = '\n'.join(block_lines)

    clean_base = (base_description or '').strip()
    stripped_base = re.sub(r'\n{2}(?:DAMAGE SPECIFICATION|ESPECIFICACION DEL DAÑO)[\s\S]*$', '', clean_base)
    stripped_base = re.sub(r'\[Hardware Details\][\s\S]*?\[\/Hardware Details\]', '', stripped_base).strip()

    return f'{stripped_base}\n\n{hardware_block}'.strip() if stripped_base else hardware_block


def _notify_inventory_approved(ticket: Ticket, db: Session, asset_item_override: Optional[str] = None, asset_condition_override: Optional[str] = None) -> dict:
    try:
        desk_location = ticket.id_station
        description = ticket.description or ""
        asset_item = asset_item_override or _get_asset_item_from_ticket(ticket)
        asset_condition = asset_condition_override or _parse_category_detail(ticket.category_detail).get('asset_status')
        
        if not desk_location:
            return {"success": False, "error": "Falta desk_location (id_station)"}
        if not asset_item:
            return {"success": False, "error": "No se pudo determinar assetItem"}
        if asset_condition not in ['Return', 'Damage', 'Missing']:
            return {"success": False, "error": f"assetCondition debe ser Return/Damage/Missing, recibido: {asset_condition}"}
        
        payload = {
            "ticketId": str(ticket.id_ticket),
            "deskLocation": desk_location,
            "assetItem": asset_item,
            "assetCondition": asset_condition,
            "description": description
        }
        
        response = requests.post(
            f"{INVENTORY_API_URL}/api/ticket-approved",
            headers={
                "Content-Type": "application/json",
                "X-API-Token": INVENTORY_API_KEY
            },
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return {"success": True, "data": data}
        else:
            return {"success": False, "error": f"Error {response.status_code}: {response.text}"}
            
    except requests.exceptions.Timeout:
        return {"success": False, "error": "Timeout al conectar con inventario"}
    except requests.exceptions.ConnectionError:
        return {"success": False, "error": "No se pudo conectar con inventario"}
    except Exception as e:
        return {"success": False, "error": f"Error inesperado: {str(e)}"}


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

    parsed_detail = _parse_category_detail(ticket.category_detail)
    description = ticket.description or ''
    hardware_component = parsed_detail.get('hardware_component')
    if hardware_component:
        description = _build_hardware_description(description, hardware_component, parsed_detail.get('asset_status'))

    db_ticket = Ticket(
        title=ticket.title,
        description=description,
        id_category=ticket.id_category,
        id_station=ticket.id_station,
        priority=ticket.priority,
        category_detail=ticket.category_detail,
        created_by=ticket.created_by,
    )
    db.add(db_ticket)
    db.flush()

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
        action_type="open_ticket",
        severity="info",
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

    print(f"\n[DEBUG] update_ticket llamado para ID: {ticket_id}")
    print(f"  • category_detail: {ticket.category_detail}")

    db_ticket = db.query(Ticket).filter(Ticket.id_ticket == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    previous_status = _normalize_status(db_ticket.status)
    previous_primary = db_ticket.primary_technician
    previous_secondary = db_ticket.secondary_technician
    actor_user = getattr(ticket, 'moved_by', None) or getattr(db_ticket, 'moved_by', None) or db_ticket.created_by

    for key, value in ticket.dict(exclude_unset=True).items():
        setattr(db_ticket, key, value)

    effective_category_detail = ticket.category_detail or db_ticket.category_detail
    if effective_category_detail:
        parsed_detail = _parse_category_detail(effective_category_detail)
        hardware_component = parsed_detail.get('hardware_component')
        if hardware_component:
            db_ticket.description = _build_hardware_description(
                db_ticket.description,
                hardware_component,
                parsed_detail.get('asset_status'),
            )

    db.add(db_ticket)
    db.flush()

    normalized_status = _normalize_status(ticket.status) if ticket.status else previous_status
    role_one_user_ids = _get_role_one_user_ids(db)

    # ============================================
    # ✅ HOOK FIX: Evaluar autorización SIN depender de que category_detail "cambie"
    # ============================================
    
    if effective_category_detail:
        try:
            parsed = _parse_category_detail(effective_category_detail)
            auth_decision = parsed.get('authorization_decision')
            auth_by = parsed.get('authorization_by')
            auth_by_str = str(auth_by) if auth_by is not None else None
            asset_condition = parsed.get('asset_status')
            
            # Fallback: si asset_condition no viene en parsed, buscar en db_ticket
            if not asset_condition or asset_condition == 'None':
                db_parsed = _parse_category_detail(db_ticket.category_detail)
                asset_condition = db_parsed.get('asset_status')
            
            # Normalizar a formato estándar (case-insensitive)
            if asset_condition:
                asset_condition = asset_condition.capitalize()
            
            # Ejecutar sincronización si es aprobación válida de id=1
            if auth_decision == 'approved' and auth_by_str == '1':
                if asset_condition and asset_condition.lower() in ['return', 'damage', 'missing']:
                    asset_item = _get_asset_item_from_ticket(db_ticket)
                    
                    if asset_item and db_ticket.id_station:
                        # Evitar sincronizar múltiples veces
                        existing_sync = db.query(ChangeHistory).filter(
                            ChangeHistory.id_ticket == db_ticket.id_ticket,
                            ChangeHistory.change_description.like(f"Inventory sync: {asset_condition}%")
                        ).first()
                        
                        if not existing_sync:
                            inventory_result = _notify_inventory_approved(
                                db_ticket, 
                                db, 
                                asset_item_override=asset_item,
                                asset_condition_override=asset_condition
                            )
                            
                            if inventory_result.get('success'):
                                db.add(ChangeHistory(
                                    id_ticket=db_ticket.id_ticket,
                                    action_user=actor_user,
                                    change_description=f"Inventory sync: {asset_condition} - {asset_item}",
                                ))
                            else:
                                error_msg = inventory_result.get('error', 'Unknown error')
                                db.add(ChangeHistory(
                                    id_ticket=db_ticket.id_ticket,
                                    action_user=actor_user,
                                    change_description=f"Inventory sync failed: {error_msg}",
                                ))
        except Exception as e:
            logger.warning(f"Error en hook de autorización: {str(e)}")
    # ============================================
    # FIN Hook fix
    # ============================================

    if ticket.status and normalized_status != previous_status:
        db.add(ChangeHistory(
            id_ticket=db_ticket.id_ticket,
            action_user=actor_user,
            change_description=f"Status changed from {previous_status.title()} to {normalized_status.title()}",
        ))
        status_recipients = {db_ticket.created_by, *role_one_user_ids}
        if db_ticket.primary_technician:
            status_recipients.add(db_ticket.primary_technician)
        if db_ticket.secondary_technician:
            status_recipients.add(db_ticket.secondary_technician)
        _create_notifications(
            db,
            status_recipients,
            f"Ticket #{db_ticket.id_ticket} changed to {normalized_status.title()}",
            exclude_user_id=actor_user,
            action_type="open_ticket",
            severity="critical" if normalized_status == "pending" else "info",
            id_ticket=db_ticket.id_ticket,
            id_station=db_ticket.id_station,
        )

    if ticket.primary_technician is not None or ticket.secondary_technician is not None:
        assignment_actor_user = ticket.moved_by if ticket.moved_by else None
        assigned_by_name = _get_user_display_name(db, assignment_actor_user)
        assignment_message = f"{assigned_by_name} assigned you to ticket #{db_ticket.id_ticket}: {db_ticket.title}"
        if db_ticket.primary_technician and db_ticket.primary_technician != previous_primary:
            _create_notifications(
                db, {db_ticket.primary_technician}, assignment_message,
                action_type="open_ticket", severity="info",
                id_ticket=db_ticket.id_ticket, id_station=db_ticket.id_station,
            )
        if db_ticket.secondary_technician and db_ticket.secondary_technician != previous_secondary:
            _create_notifications(
                db, {db_ticket.secondary_technician}, assignment_message,
                action_type="open_ticket", severity="info",
                id_ticket=db_ticket.id_ticket, id_station=db_ticket.id_station,
            )
        _create_notifications(
            db, set(role_one_user_ids),
            f"Ticket #{db_ticket.id_ticket} technician assignment was updated",
            exclude_user_id=assignment_actor_user,
            action_type="open_ticket", severity="info",
            id_ticket=db_ticket.id_ticket,
            id_station=db_ticket.id_station,
        )

    if normalized_status == "resolved" and previous_status != "resolved":
        db.add(ChangeHistory(
            id_ticket=db_ticket.id_ticket,
            action_user=actor_user,
            change_description=f"Ticket resolved: {db_ticket.title}",
        ))
        if db_ticket.id_station:
            remaining_active = db.query(Ticket).filter(
                Ticket.id_station == db_ticket.id_station,
                Ticket.status != EstadoTicket.RESOLVED,
                Ticket.id_ticket != db_ticket.id_ticket,
            ).count()
            station = db.query(Station).filter(Station.id_station == db_ticket.id_station).first()
            if station:
                station.current_status = EstadoEstacion.DISPONIBLE if remaining_active == 0 else EstadoEstacion.NO_DISPONIBLE

    _refresh_open_ticket_priorities(db)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)):
    db_ticket = db.query(Ticket).filter(Ticket.id_ticket == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=422, detail="Ticket not found")
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
            station.current_status = EstadoEstacion.DISPONIBLE if remaining_active == 0 else EstadoEstacion.NO_DISPONIBLE
    _refresh_open_ticket_priorities(db)
    db.commit()
    return None