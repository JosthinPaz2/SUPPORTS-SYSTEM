export interface Desk {
  id: string;                     // Identificador único del escritorio
  x: number;                      // Posición horizontal en el mapa o grid
  y: number;                      // Posición vertical en el mapa o grid
  width: number;                  // Ancho del escritorio
  height: number;                 // Alto del escritorio
  type?: 'management' | 'store' | 'regular' | 'empty' | 'entrance'; 
  // Tipo opcional del escritorio: puede ser de dirección, tienda, normal, vacío o entrada
}

export type DeskLayoutData = Desk[];
// Lista de escritorios que conforman un layout de oficina

export type OfficeMapMode = 'add' | 'edit' | 'view';
// Modos posibles del mapa: agregar elementos, editar existentes o solo visualizar

export interface LocationOption {
  id_location: number;            // ID único de la ubicación
  location_name: string;          // Nombre descriptivo de la ubicación
}

export interface FloorOption {
  id_floor: number;               // ID único del piso
  floor_name: string;             // Nombre del piso (ej: "Planta 1")
  id_location: number;            // Referencia a la ubicación a la que pertenece este piso
}

export interface MapDecoration {
  id_decoration: number;          // ID único de la decoración
  id_zone: number;                // ID de la zona a la que pertenece
  decoration_type: string;        // Tipo de decoración (ej: planta, póster)
  label?: string | null;          // Etiqueta opcional que describe la decoración
  pos_x: number;                  // Posición X en el mapa
  pos_y: number;                  // Posición Y en el mapa
  width: number;                  // Ancho de la decoración
  height: number;                 // Alto de la decoración
  rotation: number;               // Rotación en grados
  color?: string | null;          // Color opcional de la decoración
}

export interface MapStation {
  id_station: string;             // ID único de la estación
  id_zone: number;                // Zona en la que se encuentra
  current_status: string;         // Estado actual de la estación (ej: libre, ocupada)
  pos_x: number;                  // Posición X en el mapa
  pos_y: number;                  // Posición Y en el mapa
  rotation: number;               // Rotación de la estación
  width: number;                  // Ancho de la estación
  height: number;                 // Alto de la estación
  has_active_reports: boolean;    // Indica si hay reportes activos asociados a esta estación
}

export interface MapZoneResponse {
  id_zone: number;                // ID de la zona
  stations: MapStation[];         // Lista de estaciones dentro de esta zona
  decorations: MapDecoration[];   // Lista de decoraciones dentro de esta zona
}