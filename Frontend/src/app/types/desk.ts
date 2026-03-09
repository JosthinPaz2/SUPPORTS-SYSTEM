export interface Desk {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type?: 'management' | 'store' | 'regular' | 'empty' | 'entrance';
}

export type DeskLayoutData = Desk[];

export type OfficeMapMode = 'add' | 'edit' | 'view';

export interface LocationOption {
  id_location: number;
  location_name: string;
}

export interface FloorOption {
  id_floor: number;
  floor_name: string;
  id_location: number;
}

export interface MapDecoration {
  id_decoration: number;
  id_zone: number;
  decoration_type: string;
  label?: string | null;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string | null;
}

export interface MapStation {
  id_station: string;
  id_zone: number;
  current_status: string;
  pos_x: number;
  pos_y: number;
  rotation: number;
  width: number;
  height: number;
  has_active_reports: boolean;
}

export interface MapZoneResponse {
  id_zone: number;
  stations: MapStation[];
  decorations: MapDecoration[];
}
