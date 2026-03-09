from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from db.session import SessionLocal
from dtos.map_dto import (
    MapSaveRequest,
    MapZoneResponse,
    MapStationOut,
    MapDecorationSaveRequest,
)
from models.map_decoration import MapDecoration
from models.station import Station, EstadoEstacion
from models.ticket import Ticket, EstadoTicket

router = APIRouter(prefix="/api/map", tags=["office-map"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{id_zone}", response_model=MapZoneResponse)
def get_map_by_zone(id_zone: int, db: Session = Depends(get_db)):
    stations = db.query(Station).filter(Station.id_zone == id_zone).all()

    if not stations:
        # Fallback for legacy rows where id_zone has not been assigned yet.
        stations = db.query(Station).filter(Station.id_floor == id_zone).all()

    station_ids = [station.id_station for station in stations]
    active_ticket_count: dict[str, int] = {}
    if station_ids:
        rows = (
            db.query(Ticket.id_station, func.count(Ticket.id_ticket))
            .filter(Ticket.id_station.in_(station_ids))
            .filter(Ticket.status != EstadoTicket.RESOLVED)
            .group_by(Ticket.id_station)
            .all()
        )
        active_ticket_count = {row[0]: row[1] for row in rows if row[0] is not None}

    decorations = (
        db.query(MapDecoration)
        .filter(MapDecoration.id_zone == id_zone)
        .order_by(MapDecoration.id_decoration.asc())
        .all()
    )

    station_payload = [
        MapStationOut(
            id_station=station.id_station,
            id_zone=station.id_zone,
            current_status=station.current_status.value
            if hasattr(station.current_status, "value")
            else str(station.current_status),
            pos_x=station.pos_x or 0,
            pos_y=station.pos_y or 0,
            rotation=station.rotation or 0,
            width=station.width or 8,
            height=station.height or 4,
            has_active_reports=active_ticket_count.get(station.id_station, 0) > 0,
        )
        for station in stations
    ]

    return MapZoneResponse(id_zone=id_zone, stations=station_payload, decorations=decorations)


@router.put("/save")
def save_map_stations(payload: MapSaveRequest, db: Session = Depends(get_db)):
    if not payload.stations:
        return {"updated": 0, "message": "No stations to update"}

    ids = [item.id_station for item in payload.stations]
    db_stations = db.query(Station).filter(Station.id_station.in_(ids)).all()
    station_by_id = {station.id_station: station for station in db_stations}

    for item in payload.stations:
        station = station_by_id.get(item.id_station)
        if station is None:
            station = Station(
                id_station=item.id_station,
                id_floor=item.id_zone,
                id_zone=item.id_zone,
                current_status=EstadoEstacion.DISPONIBLE,
                pos_x=item.pos_x,
                pos_y=item.pos_y,
                rotation=item.rotation,
                width=item.width,
                height=item.height,
            )
            db.add(station)
            station_by_id[item.id_station] = station
            continue

        station.id_zone = item.id_zone
        station.id_floor = item.id_zone
        station.pos_x = item.pos_x
        station.pos_y = item.pos_y
        station.rotation = item.rotation
        station.width = item.width
        station.height = item.height

    db.commit()
    return {"updated": len(payload.stations), "message": "Map saved successfully"}


@router.put("/decorations/save")
def save_map_decorations(payload: MapDecorationSaveRequest, db: Session = Depends(get_db)):
    db.query(MapDecoration).filter(MapDecoration.id_zone == payload.id_zone).delete(
        synchronize_session=False
    )

    new_rows = []
    for item in payload.decorations:
        decoration = MapDecoration(
            id_zone=payload.id_zone,
            decoration_type=item.decoration_type,
            label=item.label,
            pos_x=item.pos_x,
            pos_y=item.pos_y,
            width=item.width,
            height=item.height,
            rotation=item.rotation,
            color=item.color,
        )
        new_rows.append(decoration)

    if new_rows:
        db.add_all(new_rows)

    db.commit()
    return {"saved": len(new_rows), "message": "Decorations saved successfully"}
