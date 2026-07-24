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
    "teclado": "Teclado ESENSES Basico USB",
    "mouse": "Mouse Alámbrico HP Óptico negro 100",
    "cpu": "CPU",
    "cable-vga": "Cable Display Port a VGA 1,8",
    "cable-vga-vga": "Cable Display VGA a VGA 1,8",
    "extension": "Extension de Cable eléctrico",
    "cable-hdmi": "Cable HDMI a HDMI 1,8 Metros",
    "cable-vga-hdmi": "Cable VGA a HDMI 1,8 Metros",
    "cable-display-hdmi": "Cable Display Port a HDMI 1,8",
    "cable-lan": "Cable LAN-RJ45 1,8 Metros",
    "conversor-vga": "Conversores Displayport a VGA Hembra",
    "ethernet": "Ethernet 3,0 LAN a USB",
    "ethernet-usb": "Ethernet USB",
    "ethernet-usb-2": "Ethernet USB 2,0",
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
def _build_hardware_description(base_description: Optional[str], component_key: str, asset_status: Optional[str] = None, monitor_location: Optional[str] = None, title: Optional[str] = None) -> str:
    # 1. Limpiar descripción base
    clean_base = (base_description or '').strip()

    # 2. 🔹 EXTRAER monitor_location de título Y descripción
    # Combinar título y descripción para buscar
    combined_text = f"{title or ''} {clean_base}".lower()
    
    if not monitor_location and combined_text:
        # Indicadores de LEFT
        if any(word in combined_text for word in ['left', 'izquierda', 'left screen', 'screen left', 'pantalla izquierda']):
            monitor_location = 'Left'
        # Indicadores de RIGHT  
        elif any(word in combined_text for word in ['right', 'derecha', 'right screen', 'screen right', 'pantalla derecha']):
            monitor_location = 'Right'

    # 3. Eliminar CUALQUIER bloque DAMAGE SPECIFICATION existente
    stripped_base = re.sub(
        r'(?:\n{2}|\n)(?:DAMAGE SPECIFICATION|ESPECIFICACION DEL DAÑO)[\s\S]*$',
        '',
        clean_base,
        flags=re.IGNORECASE
    ).strip()

    # 4. Extraer solo el contenido del usuario
    user_content = stripped_base
    if re.match(r'^(?:USER SPECIFICATION|ESPECIFICACIÓN DEL USUARIO|ESPECIFICACION DEL USUARIO)\n', stripped_base, flags=re.IGNORECASE):
        user_content = re.sub(
            r'^(?:USER SPECIFICATION|ESPECIFICACIÓN DEL USUARIO|ESPECIFICACION DEL USUARIO)\n',
            '',
            stripped_base,
            flags=re.IGNORECASE
        ).strip()

    # 5. Obtener etiqueta del dispositivo
    device_type_label = _HARDWARE_COMPONENT_MAP.get(component_key, component_key)

    # 6. Construir bloque DAMAGE SPECIFICATION
    damage_lines = [
        'DAMAGE SPECIFICATION',
        f'- Device Type: {device_type_label}'
    ]

    if asset_status:
        status_label = _ASSET_STATUS_LABELS.get(asset_status.strip().lower(), asset_status.capitalize())
        damage_lines.append(f'- Asset Condition: {status_label}')

    # 7. 🔹 AGREGAR Component: Left/Right Screen
    if monitor_location == 'Left':
        damage_lines.append('- Component: Left Screen')
    elif monitor_location == 'Right':
        damage_lines.append('- Component: Right Screen')
    elif component_key == 'cpu':
        damage_lines.append('- Component: CPU (Central Processing Unit)')

    final_damage_block = '\n'.join(damage_lines)

    # 8. Combinar
    if user_content:
        return f"USER SPECIFICATION\n{user_content}\n\n{final_damage_block}"
    else:
        return final_damage_block
def _notify_inventory_approved(ticket: Ticket, db: Session, asset_item_override: Optional[str] = None, asset_condition_override: Optional[str] = None) -> dict:
    logger.info(f"   _notify_inventory_approved LLAMADO")
    logger.info(f"   ticket_id: {ticket.id_ticket}")
    logger.info(f"   id_station: {ticket.id_station}")
    logger.info(f"   category_detail: {ticket.category_detail}")
    
    try:
        desk_location = ticket.id_station
        description = ticket.description or ""
        title = ticket.title or "" 
        asset_item = asset_item_override or _get_asset_item_from_ticket(ticket)
        asset_condition = asset_condition_override or _parse_category_detail(ticket.category_detail).get('asset_status')
        
        parsed_detail = _parse_category_detail(ticket.category_detail)
        component_key = parsed_detail.get('hardware_component')
        
        monitor_location = parsed_detail.get('monitor_location')
        
        if not monitor_location:
            combined_text = f"{title} {description}".lower()
            if any(word in combined_text for word in ['left', 'izquierda', 'izquierdo', 'left screen', 'screen left', 'pantalla izquierda', 'monitor izquierdo']):
                monitor_location = 'Left'
                logger.info(f"   🔍 monitor_location inferido de título/descripción: 'Left'")
            elif any(word in combined_text for word in ['right', 'derecha', 'derecho', 'right screen', 'screen right', 'pantalla derecha', 'monitor derecho']):
                monitor_location = 'Right'
                logger.info(f"   🔍 monitor_location inferido de título/descripción: 'Right'")
        
        if not monitor_location:
            if component_key == 'pantalla-izquierda':
                monitor_location = 'Left'
            elif component_key == 'pantalla-derecha':
                monitor_location = 'Right'
        
        logger.info(f"   asset_item calculado: '{asset_item}'")
        logger.info(f"   asset_condition: '{asset_condition}'")
        logger.info(f"   desk_location: '{desk_location}'")
        logger.info(f"   title: '{title}'") 
        logger.info(f"   monitor_location final: '{monitor_location}'")
        
        if not desk_location:
            logger.error("Falta desk_location")
            return {"success": False, "error": "Falta desk_location (id_station)"}
        if not asset_item:
            logger.error("No se pudo determinar assetItem")
            return {"success": False, "error": "No se pudo determinar assetItem"}
        if asset_condition not in ['Return', 'Damage', 'Missing']:
            logger.error(f"assetCondition inválido: {asset_condition}")
            return {"success": False, "error": f"assetCondition debe ser Return/Damage/Missing, recibido: {asset_condition}"}
        
        # 🔹 OBTENER NOMBRES COMPLETOS DE USUARIOS
        reviewed_by_name = None 
        approved_by_name = None  
        
        authorization_by_id = parsed_detail.get('authorization_by')
        if authorization_by_id:
            approver = db.query(User).filter(User.id_user == int(authorization_by_id)).first()
            approved_by_name = approver.full_name if approver else f"User #{authorization_by_id}"
            logger.info(f"   Admin que aprobó: {approved_by_name} (ID: {authorization_by_id})")

        escalator_changes = db.query(ChangeHistory).filter(
            ChangeHistory.id_ticket == ticket.id_ticket,
            ChangeHistory.action_user.isnot(None),
            ~ChangeHistory.change_description.like('%authorization%'),
            ~ChangeHistory.change_description.like('%Inventory sync%')
        ).order_by(ChangeHistory.created_at.desc()).all()
        
        for change in escalator_changes:
            if authorization_by_id and change.action_user == int(authorization_by_id):
                continue 
            escalator = db.query(User).filter(User.id_user == change.action_user).first()
            if escalator:
                reviewed_by_name = escalator.full_name
                logger.info(f"   Analista que escaló: {reviewed_by_name} (ID: {change.action_user})")
                logger.info(f"      Cambio: {change.change_description}")
                break
        
        if not reviewed_by_name and ticket.created_by:
            creator = db.query(User).filter(User.id_user == ticket.created_by).first()
            reviewed_by_name = creator.full_name if creator else f"User #{ticket.created_by}"
            logger.info(f"   Fallback: usando creador del ticket: {reviewed_by_name}")
        
        if not approved_by_name:
            approved_by_name = reviewed_by_name
        
        payload = {
            "ticketId": str(ticket.id_ticket),
            "deskLocation": desk_location,
            "assetItem": asset_item,
            "assetCondition": asset_condition,
            "description": description,
            "monitorLocation": monitor_location,
            "reviewedBy": reviewed_by_name, 
            "approvedBy": approved_by_name    
        }
        
        logger.info(f"   reviewed_by: {reviewed_by_name}")
        logger.info(f"   approved_by: {approved_by_name}")
        
        payload = {k: v for k, v in payload.items() if v is not None and v != 'None'}
        
        logger.info(f"Enviando POST a: {INVENTORY_API_URL}/api/ticket-approved")
        logger.info(f"Token: '{INVENTORY_API_KEY}'")
        logger.info(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(
            f"{INVENTORY_API_URL}/api/ticket-approved",
            headers={
                "Content-Type": "application/json",
                "X-API-Token": INVENTORY_API_KEY
            },
            json=payload,
            timeout=10
        )
        
        logger.info(f"Respuesta HTTP: {response.status_code}")
        logger.info(f"Body respuesta: {response.text[:300]}")
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"Webhook exitoso: {data.get('message', '')}")
            return {"success": True, "data": data}
        else:
            logger.error(f"Error del servidor: {response.status_code} - {response.text}")
            return {"success": False, "error": f"Error {response.status_code}: {response.text}"}
            
    except requests.exceptions.Timeout:
        logger.error("Timeout al conectar con inventario")
        return {"success": False, "error": "Timeout al conectar con inventario"}
    except requests.exceptions.ConnectionError:
        logger.error("No se pudo conectar con inventario (ConnectionError)")
        return {"success": False, "error": "No se pudo conectar con inventario"}
    except Exception as e:
        logger.error(f"Error inesperado: {str(e)}", exc_info=True)
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
    monitor_location = parsed_detail.get('monitor_location')  

    if hardware_component:
        description = _build_hardware_description(
            description, 
            hardware_component, 
            parsed_detail.get('asset_status'),
            monitor_location,
            ticket.title 
        )

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
        monitor_location = parsed_detail.get('monitor_location')
        
        if hardware_component:
            db_ticket.description = _build_hardware_description(
                db_ticket.description,
                hardware_component,
                parsed_detail.get('asset_status'),
                monitor_location,
                ticket.title or db_ticket.title
            )

    db.add(db_ticket)
    db.flush()

    normalized_status = _normalize_status(ticket.status) if ticket.status else previous_status
    role_one_user_ids = _get_role_one_user_ids(db)

    if effective_category_detail:
        try:
            parsed = _parse_category_detail(effective_category_detail)
            auth_decision = parsed.get('authorization_decision')
            auth_by = parsed.get('authorization_by')
            auth_by_str = str(auth_by) if auth_by is not None else None
            asset_condition = parsed.get('asset_status')
            
            if not asset_condition or asset_condition == 'None':
                db_parsed = _parse_category_detail(db_ticket.category_detail)
                asset_condition = db_parsed.get('asset_status')
            
            if asset_condition:
                asset_condition = asset_condition.capitalize()
            
            if auth_decision == 'approved' and auth_by_str == '1':
                if asset_condition and asset_condition.lower() in ['return', 'damage', 'missing']:
                    asset_item = _get_asset_item_from_ticket(db_ticket)
                    
                    if asset_item and db_ticket.id_station:
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