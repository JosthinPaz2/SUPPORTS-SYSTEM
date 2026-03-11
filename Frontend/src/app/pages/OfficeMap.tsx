/**
 * Página: OfficeMap
 * 
 * Descripción:
 * Este es el componente principal de la página del mapa de oficinas (Office Map).
 * Actúa como contenedor que orquesta todos los subcomponentes y gestiona el estado
 * global de la aplicación de mapas de escritorios.
 * 
 * Esta página permite:
 * - Visualizar un mapa interactivo de la oficina con escritorios
 * - Arrastrar y soltar (drag-and-drop) escritorios desde el sidebar al mapa
 * - Importar datos de escritorios desde archivos CSV
 * - Buscar y filtrar elementos en el inventario
 * - Rotar y posicionar elementos en el canvas
 * - Ver estadísticas en tiempo real sobre los escritorios
 * 
 * Estructura de componentes:
 * 1. OfficeMapHeader - Encabezado con título y navegación
 * 2. StatsCards - Tarjetas de estadísticas (total, con reportes, sin problemas)
 * 3. MapLegend - Leyenda de colores del mapa
 * 4. MapSidebar - Panel lateral con inventario y herramientas
 * 5. MapCanvas - Área principal del mapa con elementos SVG
 * 6. TipBox - Caja de consejos para el usuario
 * 
 * Estados (State Management):
 * - search: Valor del campo de búsqueda
 * - desks: Array de todos los escritorios/objetos
 * - activeTab: Pestaña activa en el sidebar (inventory/objects)
 * - draggingId: ID del elemento actualmente siendo arrastrado
 * - resizingId: ID del elemento actualmente siendo redimensionado
 * 
 * Handlers:
 * - handleFileUpload: Procesa archivos CSV subidos por el usuario
 * - rotateItem: Rota un elemento intercambiando width y height
 * - handleSvgDrop: Maneja el evento de soltar un elemento en el canvas
 * - handleMouseMove: Maneja el movimiento del mouse para arrastrar/redimensionar
 * - handleMouseUp: Finaliza las operaciones de arrastre/redimensionado
 * - handleCanvasMouseDown: Inicia el arrastre de un elemento en el mapa
 * 
 * Constantes:
 * - CANVAS_WIDTH: Ancho del área del mapa (2400px)
 * - CANVAS_HEIGHT: Alto del área del mapa (5000px)
 * - defaultObjects: Objetos por defecto disponibles para agregar al mapa
 * 
 * Dependencias:
 * - react: use_state, useRef para gestión de estado
 * - ../components/OfficeMap: Subcomponentes del mapa de oficinas
 */

import { useEffect, useMemo, useState, useRef } from 'react';
import { CheckCircle2, AlertCircle, User } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  OfficeMapHeader, 
  StatsCards, 
  MapLegend, 
  MapSidebar, 
  MapCanvas, 
  TipBox 
} from '../components/OfficeMap';
import TicketForm from '../components/TicketForm';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  apiService,
  FloorOption,
  LocationOption,
  MapDecorationSavePayload,
  MapStationSavePayload,
  TicketResponseDto,
} from '../utils/api';
import { toast } from 'sonner'; // Importamos toast para las notificaciones

// Objetos por defecto disponibles para agregar al mapa
// Incluye zonas, marcos, áreas de tienda, gestión y entrada
const defaultObjects = [
  { id: 'GRAY-ZONE', type: 'zone', width: 600, height: 400, placed: false, isDefault: true },
  { id: 'FRAME-OBJECT', type: 'frame', width: 300, height: 600, placed: false, isDefault: true },
  { id: 'STORE-AREA', type: 'store', width: 200, height: 100, placed: false, isDefault: true },
  { id: 'MANAGEMENT', type: 'management', width: 180, height: 80, placed: false, isDefault: true },
  { id: 'ENTRANCE', type: 'entrance', width: 150, height: 60, placed: false, isDefault: true },
];

export default function OfficeMap() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  // Inicializar desks con los objetos por defecto en el inventario
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [desks, setDesks] = useState<any[]>(defaultObjects);
  const [activeTab, setActiveTab] = useState<'inventory' | 'objects'>('inventory');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'select' | 'add' | 'edit' | 'view'>('select');
  const [currentZoneId, setCurrentZoneId] = useState<number | null>(null);
  const [initialPlacedDeskIds, setInitialPlacedDeskIds] = useState<string[]>([]);
  const [savingMap, setSavingMap] = useState(false);
  const [loadingMap, setLoadingMap] = useState(false);
  const [scale, setScale] = useState(1);
  const [viewLocations, setViewLocations] = useState<LocationOption[]>([]);
  const [viewFloors, setViewFloors] = useState<FloorOption[]>([]);
  const [selectedViewLocationId, setSelectedViewLocationId] = useState('');
  const [selectedViewFloorId, setSelectedViewFloorId] = useState('');
  const [loadingViewMetadata, setLoadingViewMetadata] = useState(false);
  const [selectedDeskId, setSelectedDeskId] = useState<string | null>(null);
  const [selectedDeskTickets, setSelectedDeskTickets] = useState<TicketResponseDto[]>([]);
  const [selectedDeskTicketDetail, setSelectedDeskTicketDetail] = useState<TicketResponseDto | null>(null);
  const [selectedDeskForTicket, setSelectedDeskForTicket] = useState<string | null>(null);
  const [showDeskTicketForm, setShowDeskTicketForm] = useState(false);
  const [deskTicketUsers, setDeskTicketUsers] = useState<Map<number, string>>(new Map());
  const [deskTicketCategories, setDeskTicketCategories] = useState<Map<number, string>>(new Map());
  const [loadingDeskTicket, setLoadingDeskTicket] = useState(false);
  const [adminLocations, setAdminLocations] = useState<LocationOption[]>([]);
  const [adminFloors, setAdminFloors] = useState<FloorOption[]>([]);
  const [adminSelectedLocationId, setAdminSelectedLocationId] = useState('');
  const [adminSelectedFloorId, setAdminSelectedFloorId] = useState('');
  const [loadingAdminMetadata, setLoadingAdminMetadata] = useState(false);
  
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 2;
  const isViewOnly = searchParams.get('viewOnly') === 'true';
  const autoOpenViewSelector = searchParams.get('openViewSelector') === 'true';

  const BASE_CANVAS_WIDTH = 2400;
  const BASE_CANVAS_HEIGHT = 5000;

  // 📊 Stats
  const totalDesks = desks.filter(d => d.type === 'desk').length;
  const reports = desks.filter(d => d.hasReport).length;
  const noIssues = desks.filter(d => d.type === 'desk' && !d.hasReport).length;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'txt') {
      toast.error('Solo se permiten archivos .csv o .txt');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text
        .split('\n')
        .slice(1)
        .map((row) => row.trim())
        .filter((row) => row.length > 0);

      // Parse header to find column indices dynamically
      const allLines = text.split('\n').map((r) => r.trim()).filter((r) => r.length > 0);
      const headerLine = allLines[0] ?? '';
      const headers = headerLine.toLowerCase().split(',').map((h) => h.trim());
      const idxId             = headers.indexOf('id');
      const idxWidth          = headers.indexOf('width');
      const idxHeight         = headers.indexOf('height');
      const idxType           = headers.indexOf('type');
      const idxCurrentStatus  = headers.indexOf('current_status');

      const parsed = rows.map((row, index) => {
        const cols = row.split(',').map((c) => c.trim());
        const idVal     = idxId     >= 0 ? cols[idxId]     : cols[0];
        const widthVal  = idxWidth  >= 0 ? cols[idxWidth]  : cols[3];
        const heightVal = idxHeight >= 0 ? cols[idxHeight] : cols[4];
        const typeVal   = idxType   >= 0 ? cols[idxType]   : cols[5];
        const statusVal = idxCurrentStatus >= 0 ? cols[idxCurrentStatus] : 'Available';

        const currentStatus = statusVal || 'Available';
        const hasReport = currentStatus === 'Not available' || currentStatus === 'Available with issues';

        return {
          id: idVal || `D-${100 + index}`,
          // CSV desks always start in inventory and are placed manually by drag/drop.
          x: null,
          y: null,
          width: Number(widthVal) || 80,
          height: Number(heightVal) || 50,
          type: typeVal || 'desk',
          placed: false,
          currentStatus,
          hasReport,
        };
      });

      setDesks(prev => [...prev, ...parsed]);
      
      // Notificación de éxito al importar CSV
      toast.success('CSV imported correctly', {
        description: `${parsed.length} desks have been imported`,
        duration: 5000,
      });
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Función para rotar un elemento (intercambia width por height)
  const rotateItem = (id: string) => {
    setDesks(prev => 
      prev.map(d => d.id === id ? { ...d, width: d.height, height: d.width } : d)
    );
    // Notificación de éxito al rotar
    toast.success('Element rotated', {
      description: 'The element has been rotated 90 degrees',
      duration: 3000,
    });
  };

  const handleSvgDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("objectData"));
    // svgRef ya no se usa - usamos e.currentTarget

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (data.isDefault) {
      // Es un objeto por defecto: crear nueva instancia
      const newObj = {
        ...data,
        id: `${data.id}-${Date.now()}`,
        x: x - data.width / 2,
        y: y - data.height / 2,
        placed: true
      };
      setDesks(prev => [...prev, newObj]);
      // Notificación de éxito al agregar elemento
      toast.success('Element added', {
        description: `The element ${data.id} has been added to the map`,
        duration: 3000,
      });
    } else {
      setDesks(prev =>
        prev.map(d =>
          d.id === data.id
            ? { ...d, x: x - d.width / 2, y: y - d.height / 2, placed: true }
            : d
        )
      );
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // svgRef ya no se usa - usamos e.currentTarget
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (draggingId) {
      setDesks(prev =>
        prev.map(d =>
          d.id === draggingId
            ? { ...d, x: mouseX - d.width / 2, y: mouseY - d.height / 2 }
            : d
        )
      );
    }

    if (resizingId) {
      setDesks(prev =>
        prev.map(d =>
          d.id === resizingId
            ? {
                ...d,
                width: Math.max(40, mouseX - d.x),
                height: Math.max(40, mouseY - d.y)
              }
            : d
        )
      );
    }
  };

  // Capas de fondo: zonas, marcos y otros objetos placed en el mapa
  const bgLayers = desks.filter(d => d.placed && (d.type === 'zone' || d.type === 'frame' || d.type === 'store' || d.type === 'management' || d.type === 'entrance'));
  // Items: escritorios placed en el mapa
  const items = desks.filter(d => d.placed && d.type === 'desk');
  // Inventario: elementos no placed que coinciden con la búsqueda
  const inventory = desks.filter(d => !d.placed && d.type === 'desk' && d.id.toLowerCase().includes(search.toLowerCase()));
  // Objects: objetos no placed (zonas, frames, store, management, entrance)
  const objects = desks.filter(d => !d.placed && (d.type === 'zone' || d.type === 'frame' || d.type === 'store' || d.type === 'management' || d.type === 'entrance') && d.id.toLowerCase().includes(search.toLowerCase()));

  const canvasSize = useMemo(() => {
    const placedItems = desks.filter((item) => item.placed && item.x != null && item.y != null);

    const maxRight = placedItems.reduce(
      (max, item) => Math.max(max, (item.x ?? 0) + (item.width ?? 0)),
      BASE_CANVAS_WIDTH,
    );

    const maxBottom = placedItems.reduce(
      (max, item) => Math.max(max, (item.y ?? 0) + (item.height ?? 0)),
      BASE_CANVAS_HEIGHT,
    );

    return {
      width: Math.max(BASE_CANVAS_WIDTH, Math.ceil((maxRight + 200) / 100) * 100),
      height: Math.max(BASE_CANVAS_HEIGHT, Math.ceil((maxBottom + 200) / 100) * 100),
    };
  }, [desks]);

  // Handler para el mouse up global
  const handleMouseUp = () => {
    setDraggingId(null);
    setResizingId(null);
  };

  // Handler para iniciar drag desde el canvas
  const handleCanvasMouseDown = (id: string) => {
    setDraggingId(id);
  };

  // Handler para iniciar el redimensionamiento
  const handleResizeStart = (id: string) => {
    setResizingId(id);
  };

  // Handler para cambiar el modo activo
  const handleModeChange = (mode: 'add' | 'edit' | 'view') => {
    setActiveMode(mode);
  };

  useEffect(() => {
    if (!isViewOnly) return;

    const loadViewMetadata = async () => {
      setLoadingViewMetadata(true);
      try {
        const [locationData, floorData] = await Promise.all([
          apiService.getLocations(),
          apiService.getFloors(),
        ]);
        setViewLocations(locationData);
        setViewFloors(floorData);
      } catch (error) {
        toast.error((error as Error).message || 'Could not load locations and floors');
      } finally {
        setLoadingViewMetadata(false);
      }
    };

    loadViewMetadata();
  }, [isViewOnly]);

  useEffect(() => {
    if (isViewOnly || (activeMode !== 'select' && activeMode !== 'view')) return;

    const loadAdminMetadata = async () => {
      setLoadingAdminMetadata(true);
      try {
        const [locationData, floorData] = await Promise.all([
          apiService.getLocations(),
          apiService.getFloors(),
        ]);

        setAdminLocations(locationData);
        setAdminFloors(floorData);
      } catch (error) {
        toast.error((error as Error).message || 'Could not load locations and floors');
      } finally {
        setLoadingAdminMetadata(false);
      }
    };

    loadAdminMetadata();
  }, [isViewOnly, activeMode]);

  useEffect(() => {
    if (isViewOnly || !currentZoneId || adminFloors.length === 0) return;

    const selectedFloor = adminFloors.find((floor) => floor.id_floor === currentZoneId);
    if (!selectedFloor) return;

    setAdminSelectedFloorId(String(selectedFloor.id_floor));
    setAdminSelectedLocationId(String(selectedFloor.id_location));
  }, [isViewOnly, currentZoneId, adminFloors]);

  useEffect(() => {
    if (!isViewOnly) return;

    if (!selectedViewFloorId) {
      setCurrentZoneId(null);
      return;
    }

    setCurrentZoneId(Number(selectedViewFloorId));
  }, [isViewOnly, selectedViewFloorId]);

  useEffect(() => {
    if (!currentZoneId) return;
    if (!isViewOnly && activeMode !== 'edit' && activeMode !== 'view') return;

    const toCanvasX = (value: number) => (value / 100) * BASE_CANVAS_WIDTH;
    const toCanvasY = (value: number) => (value / 100) * BASE_CANVAS_HEIGHT;

    let cancelled = false;

    const loadSelectedMap = async () => {
      try {
        setLoadingMap(true);
        const mapData = await apiService.getMapByZone(currentZoneId);

        const mappedStations = mapData.stations.map((station) => {
          const placed = (station.pos_x ?? 0) > 0 || (station.pos_y ?? 0) > 0;
          return {
            id: station.id_station,
            x: placed ? toCanvasX(station.pos_x ?? 0) : null,
            y: placed ? toCanvasY(station.pos_y ?? 0) : null,
            width: toCanvasX(station.width ?? 8),
            height: toCanvasY(station.height ?? 4),
            type: 'desk',
            placed,
            hasReport: station.has_active_reports,
            currentStatus: station.current_status,
          };
        });

        if (!cancelled) {
          setInitialPlacedDeskIds(
            mappedStations.filter((station) => station.placed).map((station) => station.id),
          );
        }

        const mappedDecorations = mapData.decorations.map((decoration) => {
          const normalizedType = String(decoration.decoration_type || '').toLowerCase();
          const placed = (decoration.pos_x ?? 0) > 0 || (decoration.pos_y ?? 0) > 0;
          return {
            id: decoration.label || `${normalizedType}-${decoration.id_decoration}`,
            x: placed ? toCanvasX(decoration.pos_x ?? 0) : null,
            y: placed ? toCanvasY(decoration.pos_y ?? 0) : null,
            width: toCanvasX(decoration.width ?? 10),
            height: toCanvasY(decoration.height ?? 10),
            type: normalizedType,
            placed,
          };
        });

        if (!cancelled) {
          setDesks([...defaultObjects, ...mappedStations, ...mappedDecorations]);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error((error as Error).message || 'Could not load the selected map');
        }
      } finally {
        if (!cancelled) {
          setLoadingMap(false);
        }
      }
    };

    loadSelectedMap();

    const shouldAutoRefresh = isViewOnly || activeMode === 'view';
    const intervalId = shouldAutoRefresh
      ? window.setInterval(() => {
          loadSelectedMap();
        }, 5000)
      : null;

    return () => {
      cancelled = true;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [activeMode, currentZoneId, isViewOnly]);

  const handleSaveMap = async () => {
    if (!currentZoneId) {
      toast.error('First create or select a floor to be able to save');
      return;
    }

    const toPercentX = (value: number) => Math.max(0, Math.min(100, (value / BASE_CANVAS_WIDTH) * 100));
    const toPercentY = (value: number) => Math.max(0, Math.min(100, (value / BASE_CANVAS_HEIGHT) * 100));

    const placedDesks = desks.filter((d) => d.type === 'desk' && d.placed);
    const placedDeskIds = new Set(placedDesks.map((d) => d.id));

    const stationPayloadPlaced: MapStationSavePayload[] = placedDesks.map((d) => ({
        id_station: d.id,
        id_zone: currentZoneId,
        pos_x: toPercentX(d.x ?? 0),
        pos_y: toPercentY(d.y ?? 0),
        rotation: 0,
        width: toPercentX(d.width),
        height: toPercentY(d.height),
      }));

    // Only clear coordinates for desks that were on canvas when edit started and are now removed.
    const removedDeskPayload: MapStationSavePayload[] = initialPlacedDeskIds
      .filter((id) => !placedDeskIds.has(id))
      .map((id) => {
        const existingDesk = desks.find((d) => d.id === id);
        return {
          id_station: id,
          id_zone: currentZoneId,
          pos_x: 0,
          pos_y: 0,
          rotation: 0,
          width: toPercentX(existingDesk?.width ?? 80),
          height: toPercentY(existingDesk?.height ?? 50),
        };
      });

    const stationPayload: MapStationSavePayload[] = [...stationPayloadPlaced, ...removedDeskPayload];

    const decorationPayload: MapDecorationSavePayload[] = desks
      .filter((d) => d.placed && d.type !== 'desk')
      .map((d) => ({
        decoration_type: String(d.type || '').toUpperCase(),
        label: d.id,
        pos_x: toPercentX(d.x ?? 0),
        pos_y: toPercentY(d.y ?? 0),
        width: toPercentX(d.width),
        height: toPercentY(d.height),
        rotation: 0,
        color: null,
      }));

    try {
      setSavingMap(true);
      const stationResult = await apiService.saveMapStations(stationPayload);
      const decorationResult = await apiService.saveMapDecorations(currentZoneId, decorationPayload);

      toast.success('Map saved successfully', {
        description: `${stationResult.updated} stations and ${decorationResult.saved} objects saved`,
      });

      setInitialPlacedDeskIds(placedDesks.map((d) => d.id));
    } catch (error) {
      toast.error((error as Error).message || 'Could not save the map');
    } finally {
      setSavingMap(false);
    }
  };

  // Handler para volver al menú inicial
  const handleBackToMenu = () => {
    if (isViewOnly) {
      navigate('/employee');
      return;
    }

    setActiveMode('select');
    setScale(1); // Resetear zoom al volver al menú
  };

  // Handlers para zoom
  const handleZoomIn = () => setScale((s) => Math.min(s + 0.1, MAX_SCALE));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.1, MIN_SCALE));

  // Handler para eliminar un elemento placed y devolverlo al inventory
  const handleDeleteItem = (id: string) => {
    setDesks(prev =>
      prev.map(d =>
        d.id === id
          ? { ...d, x: null, y: null, placed: false }
          : d
      )
    );
  };

  const normalizeTicketStatus = (status: string): 'pending' | 'in-progress' | 'resolved' => {
    const normalized = status.trim().toLowerCase().replace(/_/g, '-');
    if (normalized === 'resolved') return 'resolved';
    if (normalized === 'in progress' || normalized === 'in-progress') return 'in-progress';
    return 'pending';
  };

  const handleDeskClick = async (stationId: string) => {
    const clickedDesk = desks.find((desk) => desk.id === stationId && desk.type === 'desk');
    const currentStatus = String(clickedDesk?.currentStatus || '').trim().toLowerCase();
    const isAvailableDesk = currentStatus === 'available' || currentStatus === 'disponible';

    if (isViewOnly && isAvailableDesk) {
      openTicketFormForDesk(stationId);
      return;
    }

    setSelectedDeskId(stationId);
    setSelectedDeskTickets([]);

    try {
      setLoadingDeskTicket(true);
      const [tickets, users, categories] = await Promise.all([
        apiService.getTickets(),
        apiService.getUsers(),
        apiService.getCategories(),
      ]);

      const activeTickets = tickets
        .filter((ticket) => ticket.id_station === stationId)
        .filter((ticket) => normalizeTicketStatus(ticket.status) !== 'resolved')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setSelectedDeskTickets(activeTickets);
      setDeskTicketUsers(new Map(users.map((u) => [u.id_user, u.full_name])));
      setDeskTicketCategories(new Map(categories.map((c) => [c.id_category, c.category_name])));
    } catch {
      setSelectedDeskTickets([]);
    } finally {
      setLoadingDeskTicket(false);
    }
  };

  const availableViewFloors = selectedViewLocationId
    ? viewFloors.filter((floor) => floor.id_location === Number(selectedViewLocationId))
    : [];

  const selectedViewLocationName =
    viewLocations.find((location) => String(location.id_location) === selectedViewLocationId)?.location_name || '';

  const selectedViewFloorName =
    viewFloors.find((floor) => String(floor.id_floor) === selectedViewFloorId)?.floor_name || '';

  const adminAvailableFloors = adminSelectedLocationId
    ? adminFloors
        .filter((floor) => floor.id_location === Number(adminSelectedLocationId))
        .sort((a, b) => a.floor_name.localeCompare(b.floor_name))
    : [];

  const getStatusBadgeClass = (status: string) => {
    const s = normalizeTicketStatus(status);
    if (s === 'resolved') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s === 'in-progress') return 'bg-slate-800 text-white border-slate-700';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getStatusLabel = (status: string) => {
    const s = normalizeTicketStatus(status);
    if (s === 'resolved') return 'Resolved';
    if (s === 'in-progress') return 'In Progress';
    return 'Pending';
  };

  const getPriorityBadgeClass = (priority: string) => {
    const p = priority?.toLowerCase();
    if (p === 'high' || p === 'urgent') return 'bg-red-100 text-red-700 border-red-200';
    if (p === 'medium') return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const formatTicketDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const openTicketFormForDesk = (stationId: string) => {
    if (!user?.id) {
      toast.error('You must be logged in to create a ticket');
      return;
    }

    setSelectedDeskId(null);
    setSelectedDeskForTicket(stationId);
    setShowDeskTicketForm(true);
  };

  const stationReportLimitReached = selectedDeskTickets.length >= 3;

  const deskStatusDialog = (
    <Dialog open={Boolean(selectedDeskId)} onOpenChange={(open) => !open && setSelectedDeskId(null)}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
              <User className="h-4 w-4 text-slate-600" />
            </span>
            Desk {selectedDeskId}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Desk location and status information
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loadingDeskTicket && (
            <div className="flex items-center justify-center py-10 text-slate-400 text-sm">
              Loading report details...
            </div>
          )}

          {!loadingDeskTicket && selectedDeskTickets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <CheckCircle2 className="h-16 w-16 text-emerald-500" strokeWidth={1.5} />
              <p className="text-lg font-bold text-slate-800">No Active Reports</p>
              <p className="text-sm italic text-slate-500">This desk has no reported issues</p>
            </div>
          )}

          {!loadingDeskTicket && selectedDeskTickets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-sm font-medium text-red-700">
                  {selectedDeskTickets.length} active report{selectedDeskTickets.length > 1 ? 's' : ''}
                </span>
              </div>

              {selectedDeskTickets.map((ticket) => (
                <div key={ticket.id_ticket} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                  {/* Title row + status badge */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900 text-sm leading-snug">{ticket.title}</p>
                    <Badge className={`text-xs shrink-0 border ${getStatusBadgeClass(ticket.status)}`}>
                      {getStatusLabel(ticket.status)}
                    </Badge>
                  </div>

                  {/* Ticket ID + date */}
                  <p className="text-xs text-slate-400">
                    Ticket #{ticket.id_ticket} &bull; Created {formatTicketDate(ticket.created_at)}
                  </p>

                  {/* Priority */}
                  <Badge className={`text-xs border ${getPriorityBadgeClass(ticket.priority)}`}>
                    {ticket.priority}
                  </Badge>

                  {/* Description */}
                  {ticket.description && (
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{ticket.description}</p>
                  )}

                  {/* Category + Reported by */}
                  <div className="pt-1 space-y-1 text-xs text-slate-500">
                    {ticket.id_category != null && (
                      <p>
                        <span className="font-medium text-slate-600">Category:</span>{' '}
                        {deskTicketCategories.get(ticket.id_category) ?? `#${ticket.id_category}`}
                      </p>
                    )}
                    {ticket.created_by != null && (
                      <p>
                        <span className="font-medium text-slate-600">Reported by:</span>{' '}
                        {deskTicketUsers.get(ticket.created_by) ?? `User #${ticket.created_by}`}
                      </p>
                    )}
                    {ticket.primary_technician != null && (
                      <p>
                        <span className="font-medium text-slate-600">Assigned to:</span>{' '}
                        {deskTicketUsers.get(ticket.primary_technician) ?? `User #${ticket.primary_technician}`}
                      </p>
                    )}
                  </div>

                  {!isViewOnly && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDeskId(null);
                          setSelectedDeskTicketDetail(ticket);
                        }}
                      >
                        View details
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {isViewOnly && selectedDeskId && (
            <Button
              type="button"
              disabled={stationReportLimitReached}
              onClick={() => openTicketFormForDesk(selectedDeskId)}
            >
              {stationReportLimitReached ? 'Station blocked (3 reports)' : 'Create report'}
            </Button>
          )}
          <Button variant="outline" onClick={() => setSelectedDeskId(null)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const deskTicketDetailsDialog = (
    <Dialog open={Boolean(selectedDeskTicketDetail)} onOpenChange={(open) => !open && setSelectedDeskTicketDetail(null)}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Ticket #{selectedDeskTicketDetail?.id_ticket}</span>
            {selectedDeskTicketDetail && (
              <Badge className={`text-xs shrink-0 border ${getStatusBadgeClass(selectedDeskTicketDetail.status)}`}>
                {getStatusLabel(selectedDeskTicketDetail.status)}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Full report details for the selected desk issue.
          </DialogDescription>
        </DialogHeader>

        {selectedDeskTicketDetail && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Title</p>
              <p className="font-semibold text-slate-900">{selectedDeskTicketDetail.title}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={`text-xs border ${getPriorityBadgeClass(selectedDeskTicketDetail.priority)}`}>
                Priority: {selectedDeskTicketDetail.priority}
              </Badge>
              <Badge variant="outline">Created: {formatTicketDate(selectedDeskTicketDetail.created_at)}</Badge>
            </div>

            {selectedDeskTicketDetail.description && (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Description</p>
                <p className="rounded-md border border-slate-200 bg-slate-50 p-3 whitespace-pre-wrap text-slate-700">
                  {selectedDeskTicketDetail.description}
                </p>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <p>
                <span className="font-medium text-slate-600">Category:</span>{' '}
                {deskTicketCategories.get(selectedDeskTicketDetail.id_category) ?? `#${selectedDeskTicketDetail.id_category}`}
              </p>
              <p>
                <span className="font-medium text-slate-600">Reported by:</span>{' '}
                {deskTicketUsers.get(selectedDeskTicketDetail.created_by) ?? `User #${selectedDeskTicketDetail.created_by}`}
              </p>
              <p>
                <span className="font-medium text-slate-600">Assigned to:</span>{' '}
                {selectedDeskTicketDetail.primary_technician != null
                  ? (deskTicketUsers.get(selectedDeskTicketDetail.primary_technician) ?? `User #${selectedDeskTicketDetail.primary_technician}`)
                  : 'Unassigned'}
              </p>
              <p>
                <span className="font-medium text-slate-600">Desk:</span>{' '}
                {selectedDeskTicketDetail.id_station || 'N/A'}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setSelectedDeskTicketDetail(null)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (isViewOnly) {
    return (
      <div className="min-h-screen bg-gray-50 p-6" onMouseUp={handleMouseUp}>
        <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-7xl flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Office Map</h1>
              <p className="text-sm text-gray-600">Read-only office layout view</p>
            </div>
            <Button variant="outline" onClick={handleBackToMenu}>B  ack</Button>
          </div>

          <div className="grid flex-1 min-h-0 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <Card className="border-slate-200 bg-white/95 shadow-sm backdrop-blur">
              <CardContent className="pt-6 space-y-5">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Map Filter
                  </p>
                  <p className="text-sm text-slate-600">
                    Choose the office area you want to inspect.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="employeeViewLocation" className="text-sm font-medium text-slate-700">
                    Location
                  </label>
                  <Select
                    value={selectedViewLocationId}
                    onValueChange={(value) => {
                      setSelectedViewLocationId(value);
                      setSelectedViewFloorId('');
                    }}
                    disabled={loadingViewMetadata}
                  >
                    <SelectTrigger
                      id="employeeViewLocation"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 shadow-none"
                    >
                      <SelectValue placeholder={loadingViewMetadata ? 'Loading locations...' : 'Select a location'} />
                    </SelectTrigger>
                    <SelectContent>
                      {viewLocations.map((location) => (
                        <SelectItem key={location.id_location} value={String(location.id_location)}>
                          {location.location_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="employeeViewFloor" className="text-sm font-medium text-slate-700">
                    Floor
                  </label>
                  <Select
                    value={selectedViewFloorId}
                    onValueChange={setSelectedViewFloorId}
                    disabled={!selectedViewLocationId || loadingViewMetadata}
                  >
                    <SelectTrigger
                      id="employeeViewFloor"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 shadow-none"
                    >
                      <SelectValue placeholder={!selectedViewLocationId ? 'Select a location first' : 'Select a floor'} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableViewFloors.map((floor) => (
                        <SelectItem key={floor.id_floor} value={String(floor.id_floor)}>
                          {floor.floor_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-700">Read-only view</p>
                  <p className="mt-1 leading-6">
                    Select a location and floor to view the office layout. You can inspect the map and use zoom, but not edit anything.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="h-120 relative">
              {currentZoneId ? (
                <>
                  <MapCanvas
                    items={items}
                    bgLayers={bgLayers}
                    inventory={inventory}
                    CANVAS_WIDTH={canvasSize.width}
                    CANVAS_HEIGHT={canvasSize.height}
                    onDrop={handleSvgDrop}
                    onMouseMove={handleMouseMove}
                    onMouseDown={handleCanvasMouseDown}
                    onResizeStart={handleResizeStart}
                    onDeleteItem={handleDeleteItem}
                    scale={scale}
                    isReadOnly
                    onItemClick={handleDeskClick}
                  />

                  <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
                    <button
                      type="button"
                      className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow hover:bg-blue-700 transition font-semibold text-lg"
                      onClick={handleZoomIn}
                      aria-label="Zoom in"
                      title="Zoom in"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow hover:bg-blue-700 transition font-semibold text-lg"
                      onClick={handleZoomOut}
                      aria-label="Zoom out"
                      title="Zoom out"
                    >
                      −
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white text-center shadow-sm">
                  <div>
                    <p className="text-lg font-medium text-slate-600">Select a location and floor</p>
                    <p className="mt-2 text-sm text-slate-500">The map will be displayed here.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {deskStatusDialog}
        {deskTicketDetailsDialog}
        {showDeskTicketForm && selectedDeskForTicket && user?.id && (
          <TicketForm
            onClose={() => {
              setShowDeskTicketForm(false);
              setSelectedDeskForTicket(null);
            }}
            userId={String(user.id)}
            userName={user.name || ''}
            presetLocationId={selectedViewLocationId || undefined}
            presetLocationName={selectedViewLocationName || undefined}
            presetFloorId={selectedViewFloorId || undefined}
            presetFloorName={selectedViewFloorName || undefined}
            presetStationId={selectedDeskForTicket}
            hideStationSelectors
          />
        )}
      </div>
    );
  }

  // Si el modo es 'view', mostrar solo el canvas sin sidebars
  if (activeMode === 'view') {
    return (
      <div className="p-6 bg-gray-50 min-h-screen select-none flex flex-col gap-4"
           onMouseUp={handleMouseUp}>

        {/* Header simple */}
        <div className="shrink-0">
          <OfficeMapHeader />
        </div>

        {/* Leyenda */}
        <div className="shrink-0">
          <MapLegend
            onModeChange={handleModeChange}
            onBackToMenu={handleBackToMenu}
            onZoneSelected={setCurrentZoneId}
            viewOnly={isViewOnly}
            autoOpenViewModal={autoOpenViewSelector}
          />
        </div>

        <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-3 space-y-3">
          <div className="max-w-md">
            <label htmlFor="adminViewLocationFilter" className="text-sm font-medium text-slate-700">
              Filter by Location
            </label>
            <Select
              value={adminSelectedLocationId}
              onValueChange={(value) => {
                setAdminSelectedLocationId(value);
                setAdminSelectedFloorId('');
              }}
              disabled={loadingAdminMetadata}
            >
              <SelectTrigger id="adminViewLocationFilter" className="mt-2 h-11 rounded-xl border-slate-200 bg-slate-50 shadow-none">
                <SelectValue placeholder={loadingAdminMetadata ? 'Loading locations...' : 'Select a location'} />
              </SelectTrigger>
              <SelectContent>
                {adminLocations.map((location) => (
                  <SelectItem key={location.id_location} value={String(location.id_location)}>
                    {location.location_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
            {adminSelectedLocationId ? (
              adminAvailableFloors.length > 0 ? (
                <div className="overflow-x-auto pb-1">
                  <div className="inline-flex min-w-full items-end gap-1 border-b border-slate-300">
                    {adminAvailableFloors.map((floor) => {
                      const floorId = String(floor.id_floor);
                      const isActive = adminSelectedFloorId === floorId;

                      return (
                        <button
                          key={floor.id_floor}
                          type="button"
                          onClick={() => {
                            setAdminSelectedFloorId(floorId);
                            setCurrentZoneId(floor.id_floor);
                          }}
                          className={`px-4 py-2 text-sm font-medium border border-b-0 rounded-t-md whitespace-nowrap transition-colors ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {floor.floor_name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 px-2 py-1">This location has no floors created yet.</p>
              )
            ) : (
              <p className="text-sm text-slate-500 px-2 py-1">Select a location to load floor tabs.</p>
            )}
          </div>
        </div>

        {/* Canvas a pantalla completa */}
        <div className="h-120 flex gap-6 relative">
          <MapCanvas
            items={items}
            bgLayers={bgLayers}
            inventory={inventory}
            CANVAS_WIDTH={canvasSize.width}
            CANVAS_HEIGHT={canvasSize.height}
            onDrop={handleSvgDrop}
            onMouseMove={handleMouseMove}
            onMouseDown={handleCanvasMouseDown}
            onResizeStart={handleResizeStart}
            onDeleteItem={handleDeleteItem}
            scale={scale}
            isReadOnly
            onItemClick={handleDeskClick}
          />

          {/* Botones de zoom en la esquina inferior derecha */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
            <button
              type="button"
              className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow hover:bg-blue-700 transition font-semibold text-lg"
              onClick={handleZoomIn}
              aria-label="Zoom in"
              title="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow hover:bg-blue-700 transition font-semibold text-lg"
              onClick={handleZoomOut}
              aria-label="Zoom out"
              title="Zoom out"
            >
              −
            </button>
          </div>
        </div>

        {deskStatusDialog}
        {deskTicketDetailsDialog}

        {showDeskTicketForm && selectedDeskForTicket && user?.id && (
          <TicketForm
            onClose={() => {
              setShowDeskTicketForm(false);
              setSelectedDeskForTicket(null);
            }}
            userId={String(user.id)}
            userName={user.name || ''}
            presetStationId={selectedDeskForTicket}
            hideStationSelectors
          />
        )}
      </div>
    );
  }

  // Si el modo es 'add' o 'edit', mostrar interfaz completa de mapeo
  if (activeMode === 'add' || activeMode === 'edit') {
    return (
      <div className="space-y-6 p-6 bg-gray-50 min-h-screen select-none"
           onMouseUp={handleMouseUp}>

        {/* Header */}
        <OfficeMapHeader />

        {/*Statistics */}
        <StatsCards 
          totalDesks={totalDesks} 
          reports={reports} 
          noIssues={noIssues} 
        />

        {/* Leyenda del Mapa */}
        <MapLegend
          onModeChange={handleModeChange}
          onBackToMenu={handleBackToMenu}
          onZoneSelected={setCurrentZoneId}
          viewOnly={isViewOnly}
        />

        <div className="flex items-center justify-end gap-3">
          {loadingMap && <span className="text-sm text-slate-500">Loading map...</span>}
          <Button onClick={handleSaveMap} disabled={savingMap}>
            {savingMap ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {/* Layout */}
        <div className="flex gap-6 h-175 relative">

          {/* Sidebar */}
          <MapSidebar
            search={search}
            setSearch={setSearch}
            inventory={inventory}
            objects={objects}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onRotateItem={rotateItem}
            onFileUpload={handleFileUpload}
          />

          {/* Canvas */}
          <MapCanvas
            items={items}
            bgLayers={bgLayers}
            inventory={inventory}
            CANVAS_WIDTH={canvasSize.width}
            CANVAS_HEIGHT={canvasSize.height}
            onDrop={handleSvgDrop}
            onMouseMove={handleMouseMove}
            onMouseDown={handleCanvasMouseDown}
            onResizeStart={handleResizeStart}
            onDeleteItem={handleDeleteItem}
            scale={scale}
            isReadOnly={false}
          />

          {/* Botones de zoom en la esquina inferior derecha */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
            <button
              type="button"
              className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow hover:bg-blue-700 transition font-semibold text-lg"
              onClick={handleZoomIn}
              aria-label="Zoom in"
              title="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow hover:bg-blue-700 transition font-semibold text-lg"
              onClick={handleZoomOut}
              aria-label="Zoom out"
              title="Zoom out"
            >
              −
            </button>
          </div>
        </div>

        {/* Tip */}
        <TipBox />

      </div>
    );
  }

  // Si el modo es 'select', mostrar solo el menú de opciones y el canvas en blanco
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6 space-y-6">
      <OfficeMapHeader />
      <MapLegend
        onModeChange={handleModeChange}
        onBackToMenu={handleBackToMenu}
        onZoneSelected={setCurrentZoneId}
        viewOnly={isViewOnly}
        autoOpenViewModal={autoOpenViewSelector}
      />
      
      <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-5">
        <div className="max-w-md space-y-2">
          <label htmlFor="adminLocationFilter" className="text-sm font-medium text-slate-700">
            Filter by Location
          </label>
          <Select
            value={adminSelectedLocationId}
            onValueChange={(value) => {
              setAdminSelectedLocationId(value);
              setAdminSelectedFloorId('');
            }}
            disabled={loadingAdminMetadata}
          >
            <SelectTrigger id="adminLocationFilter" className="h-11 rounded-xl border-slate-200 bg-slate-50 shadow-none">
              <SelectValue placeholder={loadingAdminMetadata ? 'Loading locations...' : 'Select a location'} />
            </SelectTrigger>
            <SelectContent>
              {adminLocations.map((location) => (
                <SelectItem key={location.id_location} value={String(location.id_location)}>
                  {location.location_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          {adminSelectedLocationId ? (
            adminAvailableFloors.length > 0 ? (
              <div className="overflow-x-auto pb-1">
                <div className="inline-flex min-w-full items-end gap-1 border-b border-slate-300">
                  {adminAvailableFloors.map((floor) => {
                    const floorId = String(floor.id_floor);
                    const isActive = adminSelectedFloorId === floorId;
                    return (
                      <button
                        key={floor.id_floor}
                        type="button"
                        onClick={() => {
                          setAdminSelectedFloorId(floorId);
                          setCurrentZoneId(floor.id_floor);
                          setActiveMode('view');
                        }}
                        className={`px-4 py-2 text-sm font-medium border border-b-0 rounded-t-md whitespace-nowrap transition-colors ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {floor.floor_name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">This location has no floors created yet.</p>
            )
          ) : (
            <p className="text-sm text-slate-500">Select a location to load floor tabs.</p>
          )}
        </div>

        <div className="flex-1 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center">
          <p className="text-slate-400 text-base font-medium">Select a floor tab to open the map</p>
        </div>
      </div>
    </div>
  );
}

