from typing import Optional
from pydantic import BaseModel, Field


class MapDecorationOut(BaseModel):
    id_decoration: int
    id_zone: int
    decoration_type: str
    label: Optional[str] = None
    pos_x: float
    pos_y: float
    width: float
    height: float
    rotation: int
    color: Optional[str] = None

    class Config:
        from_attributes = True


class MapStationOut(BaseModel):
    id_station: str
    id_zone: Optional[int] = None
    current_status: str
    pos_x: float
    pos_y: float
    rotation: int
    width: float
    height: float
    has_active_reports: bool = False


class MapZoneResponse(BaseModel):
    id_zone: int
    stations: list[MapStationOut]
    decorations: list[MapDecorationOut]


class MapStationBulkUpdateItem(BaseModel):
    id_station: str
    id_zone: int
    pos_x: float = Field(ge=0, le=100)
    pos_y: float = Field(ge=0, le=100)
    rotation: int = Field(default=0, ge=0, le=360)
    width: float = Field(default=8, gt=0, le=100)
    height: float = Field(default=4, gt=0, le=100)


class MapSaveRequest(BaseModel):
    stations: list[MapStationBulkUpdateItem]


class MapDecorationBulkUpdateItem(BaseModel):
    decoration_type: str
    label: Optional[str] = None
    pos_x: float = Field(ge=0, le=100)
    pos_y: float = Field(ge=0, le=100)
    width: float = Field(default=10, gt=0, le=100)
    height: float = Field(default=10, gt=0, le=100)
    rotation: int = Field(default=0, ge=0, le=360)
    color: Optional[str] = None


class MapDecorationSaveRequest(BaseModel):
    id_zone: int
    decorations: list[MapDecorationBulkUpdateItem]
