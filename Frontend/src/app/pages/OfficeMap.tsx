/**
 Página: OfficeMap
 
 Descripción:
 Este es el componente principal de la página del mapa de oficinas (Office Map).
 Actúa como contenedor que orquesta todos los subcomponentes y gestiona el estado
 global de la aplicación de mapas de escritorios.
 
 Esta página permite:
 - Visualizar un mapa interactivo de la oficina con escritorios
 - Arrastrar y soltar (drag-and-drop) escritorios desde el sidebar al mapa
 - Importar datos de escritorios desde archivos CSV
 - Buscar y filtrar elementos en el inventario
 - Rotar y posicionar elementos en el canvas
 - Ver estadísticas en tiempo real sobre los escritorios
 
 Estructura de componentes:
 1. OfficeMapHeader - Encabezado con título y navegación
 2. StatsCards - Tarjetas de estadísticas (total, con reportes, sin problemas)
 3. MapLegend - Leyenda de colores del mapa
 4. MapSidebar - Panel lateral con inventario y herramientas
 5. MapCanvas - Área principal del mapa con elementos SVG
 6. TipBox - Caja de consejos para el usuario
 
 Estados (State Management):
 - search: Valor del campo de búsqueda
 - desks: Array de todos los escritorios/objetos
 - activeTab: Pestaña activa en el sidebar (inventory/objects)
 - draggingId: ID del elemento actualmente siendo arrastrado
 - resizingId: ID del elemento actualmente siendo redimensionado
 
 Handlers:
 - handleFileUpload: Procesa archivos CSV subidos por el usuario
 - rotateItem: Rota un elemento intercambiando width y height
 - handleSvgDrop: Maneja el evento de soltar un elemento en el canvas
 - handleMouseMove: Maneja el movimiento del mouse para arrastrar/redimensionar
 - handleMouseUp: Finaliza las operaciones de arrastre/redimensionado
 - handleCanvasMouseDown: Inicia el arrastre de un elemento en el mapa
  
 Constantes:
 - CANVAS_WIDTH: Ancho del área del mapa (2400px)
 - CANVAS_HEIGHT: Alto del área del mapa (5000px)
 - defaultObjects: Objetos por defecto disponibles para agregar al mapa
 
 Dependencias:
 - react: use_state, useRef para gestión de estado
 - ../components/OfficeMap: Subcomponentes del mapa de oficinas
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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

type RectBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

type SmartGuideLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  kind: 'alignment' | 'distance';
};

type SmartGuideLabel = {
  x: number;
  y: number;
  text: string;
};

type SmartGuides = {
  lines: SmartGuideLine[];
  labels: SmartGuideLabel[];
};

const EMPTY_SMART_GUIDES: SmartGuides = {
  lines: [],
  labels: [],
};

const GUIDE_THRESHOLD = 8;

const toBounds = (x: number, y: number, width: number, height: number): RectBounds => ({
  left: x,
  top: y,
  right: x + width,
  bottom: y + height,
  width,
  height,
  centerX: x + width / 2,
  centerY: y + height / 2,
});

const overlapLength = (aStart: number, aEnd: number, bStart: number, bEnd: number): number => {
  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
};

const buildSmartGuides = (
  moving: RectBounds,
  movingIds: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  desks: any[],
  canvasWidth: number,
  canvasHeight: number,
): SmartGuides => {
  const lines: SmartGuideLine[] = [];
  const labels: SmartGuideLabel[] = [];

  const stationary = desks
    .filter((d) => d.placed && d.x != null && d.y != null && !movingIds.includes(d.id))
    .map((d) => ({
      id: d.id as string,
      bounds: toBounds(d.x as number, d.y as number, d.width as number, d.height as number),
    }));

  const verticalCandidates: Array<{ diff: number; x: number; y1: number; y2: number }> = [];
  const horizontalCandidates: Array<{ diff: number; y: number; x1: number; x2: number }> = [];

  const considerVertical = (fromX: number, toX: number, y1: number, y2: number) => {
    const diff = Math.abs(fromX - toX);
    if (diff <= GUIDE_THRESHOLD) {
      verticalCandidates.push({ diff, x: toX, y1, y2 });
    }
  };

  const considerHorizontal = (fromY: number, toY: number, x1: number, x2: number) => {
    const diff = Math.abs(fromY - toY);
    if (diff <= GUIDE_THRESHOLD) {
      horizontalCandidates.push({ diff, y: toY, x1, x2 });
    }
  };

  stationary.forEach(({ bounds }) => {
    const y1 = Math.min(moving.top, bounds.top) - 20;
    const y2 = Math.max(moving.bottom, bounds.bottom) + 20;
    const x1 = Math.min(moving.left, bounds.left) - 20;
    const x2 = Math.max(moving.right, bounds.right) + 20;

    considerVertical(moving.left, bounds.left, y1, y2);
    considerVertical(moving.centerX, bounds.centerX, y1, y2);
    considerVertical(moving.right, bounds.right, y1, y2);

    considerHorizontal(moving.top, bounds.top, x1, x2);
    considerHorizontal(moving.centerY, bounds.centerY, x1, x2);
    considerHorizontal(moving.bottom, bounds.bottom, x1, x2);
  });

  considerVertical(moving.centerX, canvasWidth / 2, 0, canvasHeight);
  considerHorizontal(moving.centerY, canvasHeight / 2, 0, canvasWidth);

  const bestVertical = verticalCandidates.reduce<{ diff: number; x: number; y1: number; y2: number } | null>(
    (best, candidate) => (best === null || candidate.diff < best.diff ? candidate : best),
    null,
  );

  const bestHorizontal = horizontalCandidates.reduce<{ diff: number; y: number; x1: number; x2: number } | null>(
    (best, candidate) => (best === null || candidate.diff < best.diff ? candidate : best),
    null,
  );

  const verticalGuide = bestVertical;
  if (verticalGuide !== null) {
    lines.push({
      x1: verticalGuide.x,
      y1: verticalGuide.y1,
      x2: verticalGuide.x,
      y2: verticalGuide.y2,
      kind: 'alignment',
    });
  }

  const horizontalGuide = bestHorizontal;
  if (horizontalGuide !== null) {
    lines.push({
      x1: horizontalGuide.x1,
      y1: horizontalGuide.y,
      x2: horizontalGuide.x2,
      y2: horizontalGuide.y,
      kind: 'alignment',
    });
  }

  const horizontalDistanceCandidates: Array<{ gap: number; x1: number; y1: number; x2: number; y2: number }> = [];
  const verticalDistanceCandidates: Array<{ gap: number; x1: number; y1: number; x2: number; y2: number }> = [];

  stationary.forEach(({ bounds }) => {
    const verticalOverlap = overlapLength(moving.top, moving.bottom, bounds.top, bounds.bottom);
    if (verticalOverlap > 0) {
      const overlapTop = Math.max(moving.top, bounds.top);
      const overlapBottom = Math.min(moving.bottom, bounds.bottom);
      const yMid = overlapTop + (overlapBottom - overlapTop) / 2;

      if (bounds.right <= moving.left) {
        const gap = moving.left - bounds.right;
        horizontalDistanceCandidates.push({ gap, x1: bounds.right, y1: yMid, x2: moving.left, y2: yMid });
      }

      if (bounds.left >= moving.right) {
        const gap = bounds.left - moving.right;
        horizontalDistanceCandidates.push({ gap, x1: moving.right, y1: yMid, x2: bounds.left, y2: yMid });
      }
    }

    const horizontalOverlap = overlapLength(moving.left, moving.right, bounds.left, bounds.right);
    if (horizontalOverlap > 0) {
      const overlapLeft = Math.max(moving.left, bounds.left);
      const overlapRight = Math.min(moving.right, bounds.right);
      const xMid = overlapLeft + (overlapRight - overlapLeft) / 2;

      if (bounds.bottom <= moving.top) {
        const gap = moving.top - bounds.bottom;
        verticalDistanceCandidates.push({ gap, x1: xMid, y1: bounds.bottom, x2: xMid, y2: moving.top });
      }

      if (bounds.top >= moving.bottom) {
        const gap = bounds.top - moving.bottom;
        verticalDistanceCandidates.push({ gap, x1: xMid, y1: moving.bottom, x2: xMid, y2: bounds.top });
      }
    }
  });

  const bestHorizontalDistance = horizontalDistanceCandidates.reduce<{ gap: number; x1: number; y1: number; x2: number; y2: number } | null>(
    (best, candidate) => (best === null || candidate.gap < best.gap ? candidate : best),
    null,
  );

  const bestVerticalDistance = verticalDistanceCandidates.reduce<{ gap: number; x1: number; y1: number; x2: number; y2: number } | null>(
    (best, candidate) => (best === null || candidate.gap < best.gap ? candidate : best),
    null,
  );

  const horizontalDistance = bestHorizontalDistance;
  if (horizontalDistance !== null) {
    lines.push({
      x1: horizontalDistance.x1,
      y1: horizontalDistance.y1,
      x2: horizontalDistance.x2,
      y2: horizontalDistance.y2,
      kind: 'distance',
    });
    labels.push({
      x: (horizontalDistance.x1 + horizontalDistance.x2) / 2,
      y: horizontalDistance.y1 - 8,
      text: `${Math.round(horizontalDistance.gap)} px`,
    });
  }

  const verticalDistance = bestVerticalDistance;
  if (verticalDistance !== null) {
    lines.push({
      x1: verticalDistance.x1,
      y1: verticalDistance.y1,
      x2: verticalDistance.x2,
      y2: verticalDistance.y2,
      kind: 'distance',
    });
    labels.push({
      x: verticalDistance.x1 + 8,
      y: (verticalDistance.y1 + verticalDistance.y2) / 2,
      text: `${Math.round(verticalDistance.gap)} px`,
    });
  }

  return { lines, labels };
};

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{clientX:number;clientY:number;id:string} | null>(null);
  // offset between cursor and element top-left when starting drag
  const [dragOffset, setDragOffset] = useState<{x:number,y:number} | null>(null);
  const [groupDragStart, setGroupDragStart] = useState<{
    mouseX: number;
    mouseY: number;
    initialPositions: Record<string, { x: number; y: number }>;
  } | null>(null);
  // data for active resize operation
  const [resizeStartData, setResizeStartData] = useState<{
    id: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    mouseX: number;
    mouseY: number;
  } | null>(null);
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
  const [smartGuides, setSmartGuides] = useState<SmartGuides>(EMPTY_SMART_GUIDES);
  const historyRef = useRef<any[][]>([]);
  const redoRef = useRef<any[][]>([]);
  
  useEffect(() => {
    if (activeMode === 'view') {
      setSelectedId(null); // Quitamos la selección al entrar en modo vista
      setDraggingId(null); // Por seguridad, detenemos cualquier arrastre
    }
  }, [activeMode]);

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 2;
  const isViewOnly = searchParams.get('viewOnly') === 'true';
  const autoOpenViewSelector = searchParams.get('openViewSelector') === 'true';

  const BASE_CANVAS_WIDTH = 2400;
  const BASE_CANVAS_HEIGHT = 5000;

  const cloneDesksSnapshot = useCallback((snapshot: any[]) => {
    return snapshot.map((desk) => ({ ...desk }));
  }, []);

  const canUseHistory = useCallback(() => {
    return !isViewOnly && (activeMode === 'add' || activeMode === 'edit');
  }, [activeMode, isViewOnly]);

  const resetHistory = useCallback(() => {
    historyRef.current = [];
    redoRef.current = [];
  }, []);

  const pushHistorySnapshot = useCallback((snapshot?: any[]) => {
    if (!canUseHistory()) return;
    const source = snapshot ?? desks;
    historyRef.current.push(cloneDesksSnapshot(source));
    if (historyRef.current.length > 80) {
      historyRef.current.shift();
    }
    redoRef.current = [];
  }, [canUseHistory, cloneDesksSnapshot, desks]);

  const handleUndo = useCallback(() => {
    if (!canUseHistory() || historyRef.current.length === 0) return;

    const previous = historyRef.current.pop();
    if (!previous) return;

    redoRef.current.push(cloneDesksSnapshot(desks));
    setDesks(cloneDesksSnapshot(previous));
    setSmartGuides(EMPTY_SMART_GUIDES);
    setDraggingId(null);
    setResizingId(null);
    setDragOffset(null);
    setGroupDragStart(null);
  }, [canUseHistory, cloneDesksSnapshot, desks]);

  const handleRedo = useCallback(() => {
    if (!canUseHistory() || redoRef.current.length === 0) return;

    const next = redoRef.current.pop();
    if (!next) return;

    historyRef.current.push(cloneDesksSnapshot(desks));
    setDesks(cloneDesksSnapshot(next));
    setSmartGuides(EMPTY_SMART_GUIDES);
    setDraggingId(null);
    setResizingId(null);
    setDragOffset(null);
    setGroupDragStart(null);
  }, [canUseHistory, cloneDesksSnapshot, desks]);

  // 📊 Stats
  const totalDesks = desks.filter(d => d.type === 'desk').length;
  const reports = desks.filter(d => d.hasReport).length;
  const noIssues = desks.filter(d => d.type === 'desk' && !d.hasReport).length;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

      pushHistorySnapshot();
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
    pushHistorySnapshot();
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

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Corregimos sumando el scroll igual que en el movimiento
    const x = (e.clientX - rect.left + target.scrollLeft) / scale;
    const y = (e.clientY - rect.top + target.scrollTop) / scale;

    
    const correctedX = x - data.width / 2;
    const correctedY = y - data.height / 2;


    if (data.isDefault) {
      pushHistorySnapshot();
      // Es un objeto por defecto: crear nueva instancia
      const newObj = {
        ...data,
        id: `${data.id}-${Date.now()}`,
        x: correctedX,
        y: correctedY,
        placed: true
      };
      setDesks(prev => [...prev, newObj]);
      // Notificación de éxito al agregar elemento
      toast.success('Element added', {
        description: `The element ${data.id} has been added to the map`,
        duration: 3000,
      });
    } else {
      pushHistorySnapshot();
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
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Agregamos target.scrollLeft y target.scrollTop para compensar el scroll
    let mouseX = (e.clientX - rect.left + target.scrollLeft) / scale;
    let mouseY = (e.clientY - rect.top + target.scrollTop) / scale;

    let guidesToRender: SmartGuides | null = null;

    if (draggingId && groupDragStart && selectedIds.length > 1) {
      const dx = mouseX - groupDragStart.mouseX;
      const dy = mouseY - groupDragStart.mouseY;

      const movingPositions = selectedIds.reduce<Record<string, { x: number; y: number; width: number; height: number }>>((acc, selectedDeskId) => {
        const sourceDesk = desks.find((d) => d.id === selectedDeskId && d.placed && d.x != null && d.y != null);
        const initial = groupDragStart.initialPositions[selectedDeskId];
        if (!sourceDesk || !initial) return acc;
        acc[selectedDeskId] = {
          x: initial.x + dx,
          y: initial.y + dy,
          width: sourceDesk.width,
          height: sourceDesk.height,
        };
        return acc;
      }, {});

      const movingValues = Object.values(movingPositions);
      if (movingValues.length > 0) {
        const left = Math.min(...movingValues.map((item) => item.x));
        const top = Math.min(...movingValues.map((item) => item.y));
        const right = Math.max(...movingValues.map((item) => item.x + item.width));
        const bottom = Math.max(...movingValues.map((item) => item.y + item.height));
        guidesToRender = buildSmartGuides(
          toBounds(left, top, right - left, bottom - top),
          selectedIds,
          desks,
          BASE_CANVAS_WIDTH,
          BASE_CANVAS_HEIGHT,
        );
      }

      setDesks(prev =>
        prev.map(d => {
          const initial = groupDragStart.initialPositions[d.id];
          if (!initial) return d;
          return {
            ...d,
            x: initial.x + dx,
            y: initial.y + dy,
          };
        })
      );
    } else if (draggingId && dragOffset) {
      const movingDesk = desks.find((d) => d.id === draggingId && d.placed && d.x != null && d.y != null);
      if (movingDesk) {
        const nextX = mouseX - dragOffset.x;
        const nextY = mouseY - dragOffset.y;
        guidesToRender = buildSmartGuides(
          toBounds(nextX, nextY, movingDesk.width, movingDesk.height),
          [draggingId],
          desks,
          BASE_CANVAS_WIDTH,
          BASE_CANVAS_HEIGHT,
        );
      }

      setDesks(prev =>
        prev.map(d =>
          d.id === draggingId
            ? { ...d, x: mouseX - dragOffset.x, y: mouseY - dragOffset.y }
            : d
        )
      );
    }

    if (guidesToRender) {
      setSmartGuides(guidesToRender);
    } else {
      setSmartGuides((prev) => (prev.lines.length || prev.labels.length ? EMPTY_SMART_GUIDES : prev));
    }

    if (resizingId && resizeStartData && resizeStartData.id === resizingId) {
      const dx = mouseX - resizeStartData.mouseX;
      const dy = mouseY - resizeStartData.mouseY;
      setDesks(prev =>
        prev.map(d =>
          d.id === resizingId
            ? {
                ...d,
                width: Math.max(20, resizeStartData.startWidth + dx),
                height: Math.max(20, resizeStartData.startHeight + dy),
              }
            : d
        )
      );
    }
  };

  // ??? Context menu helpers ???
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
    setDragOffset(null);
    setGroupDragStart(null);
    setResizingId(null);
    setResizeStartData(null);
    setSmartGuides(EMPTY_SMART_GUIDES);
  };

  const handleSelectItem = (id: string, appendToSelection = false) => {
    closeContextMenu();

    if (appendToSelection) {
      const nextSelectedIds = selectedIds.includes(id)
        ? selectedIds.filter((selected) => selected !== id)
        : [...selectedIds, id];

      setSelectedIds(nextSelectedIds);
      setSelectedId(nextSelectedIds.length > 0 ? nextSelectedIds[nextSelectedIds.length - 1] : null);
      return;
    }

    setSelectedIds([id]);
    setSelectedId(id);
  };

  const handleSelectAllPlaced = () => {
    const placedIds = desks.filter((d) => d.placed).map((d) => d.id);
    setSelectedIds(placedIds);
    setSelectedId(placedIds.length > 0 ? placedIds[placedIds.length - 1] : null);
    closeContextMenu();
  };

  const handleMarqueeSelection = (ids: string[]) => {
    closeContextMenu();
    setSelectedIds(ids);
    setSelectedId(ids.length > 0 ? ids[ids.length - 1] : null);
  };

  const handleDeleteSelected = () => {
    const idsToDelete = selectedIds.length > 0
      ? selectedIds
      : selectedId
        ? [selectedId]
        : [];

    if (idsToDelete.length === 0) return;

    pushHistorySnapshot();
    idsToDelete.forEach((id) => handleDeleteItem(id, false));
  };

  // Handler para iniciar drag desde el canvas.
  // Recibe un desplazamiento precomputado (offsetX/offsetY) proporcionado
  // por MapCanvas para que el elemento no "salte" al arrastrarse.
<<<<<<< HEAD
  const handleCanvasMouseDown = (
    id: string,
    offsetX: number,
    offsetY: number,
    mouseX: number,
    mouseY: number,
    appendToSelection = false,
  ) => {
    closeContextMenu();

    const nextSelectedIds = appendToSelection
      ? (selectedIds.includes(id)
          ? selectedIds.filter((selected) => selected !== id)
          : [...selectedIds, id])
      : (
          // Keep the current multi-selection when clicking one of the selected items.
          selectedIds.length > 1 && selectedIds.includes(id)
            ? selectedIds
            : (selectedIds.includes(id) && selectedIds.length === 1 ? selectedIds : [id])
        );

    setSelectedIds(nextSelectedIds);
    setSelectedId(nextSelectedIds.length > 0 ? nextSelectedIds[nextSelectedIds.length - 1] : null);

    if (!nextSelectedIds.includes(id)) {
      setDraggingId(null);
      setDragOffset(null);
      setGroupDragStart(null);
      return;
    }

    pushHistorySnapshot();

    if (nextSelectedIds.length > 1) {
      const initialPositions = nextSelectedIds.reduce<Record<string, { x: number; y: number }>>((acc, selectedDeskId) => {
        const desk = desks.find((d) => d.id === selectedDeskId && d.placed && d.x != null && d.y != null);
        if (desk) {
          acc[selectedDeskId] = { x: desk.x, y: desk.y };
        }
        return acc;
      }, {});

      if (Object.keys(initialPositions).length > 1) {
        setGroupDragStart({ mouseX, mouseY, initialPositions });
        setDragOffset(null);
      } else {
        setGroupDragStart(null);
        setDragOffset({ x: offsetX, y: offsetY });
      }
    } else {
      setGroupDragStart(null);
      setDragOffset({ x: offsetX, y: offsetY });
    }

=======
  const handleCanvasMouseDown = (id: string, offsetX: number, offsetY: number) => {
  // BLOQUEO DE SEGURIDAD: Si es solo lectura o modo vista, no hacemos nada
  if (isViewOnly || activeMode === 'view') return; 

  closeContextMenu();
  setSelectedId(id);

  // Lógica "Traer al frente": Reordenamos el array para que el seleccionado sea el último
  setDesks(prev => {
    const itemIndex = prev.findIndex(d => d.id === id);
    if (itemIndex === -1) return prev;
    const newArray = [...prev];
    const [item] = newArray.splice(itemIndex, 1);
    newArray.push(item); // Al ser el último del array, el SVG lo dibuja "encima" de todo
    return newArray;
  });
    setDragOffset({ x: offsetX, y: offsetY });
>>>>>>> 2b2eef5d93a6858b5d0e8ea96b8731e4992838f1
    setDraggingId(id);
  };

  // Handler para iniciar el redimensionamiento
<<<<<<< HEAD
  const handleResizeStart = (
    id: string,
    mouseX: number,
    mouseY: number,
  ) => {
    pushHistorySnapshot();
    setSelectedId(id);
    setSelectedIds([id]);
    const desk = desks.find(d => d.id === id);
    if (desk) {
      setResizeStartData({
        id,
        startX: desk.x,
        startY: desk.y,
        startWidth: desk.width,
        startHeight: desk.height,
        mouseX,
        mouseY,
      });
=======
  const handleResizeStart = (id: string, mouseX: number, mouseY: number) => {
  // BLOQUEO DE SEGURIDAD: No permitir redimensionar en modo vista
  if (isViewOnly || activeMode === 'view') return;

  setSelectedId(id);
  const desk = desks.find(d => d.id === id);
  if (desk) {
    setResizeStartData({
      id,
      startX: desk.x,
      startY: desk.y,
      startWidth: desk.width,
      startHeight: desk.height,
      mouseX,
      mouseY,
    });
>>>>>>> 2b2eef5d93a6858b5d0e8ea96b8731e4992838f1
      setResizingId(id);
    }
  };

  // context menu / z-order operations
  const handleItemContextMenu = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);
    setSelectedIds([id]);
    setContextMenu({ clientX: e.clientX, clientY: e.clientY, id });
  };

  const closeContextMenu = () => setContextMenu(null);

  const deleteItem = (id: string) => {
    handleDeleteItem(id);
    closeContextMenu();
  };
  const moveToFront = (id: string) => {
    pushHistorySnapshot();
    setDesks(prev => {
      const idx = prev.findIndex(d => d.id === id);
      if (idx < 0) return prev;
      const item = prev[idx];
      const others = prev.filter((_, i) => i !== idx);
      return [...others, item];
    });
    closeContextMenu();
  };
  const moveToBack = (id: string) => {
    pushHistorySnapshot();
    setDesks(prev => {
      const idx = prev.findIndex(d => d.id === id);
      if (idx < 0) return prev;
      const item = prev[idx];
      const others = prev.filter((_, i) => i !== idx);
      return [item, ...others];
    });
    closeContextMenu();
  };
  const moveForward = (id: string) => {
    pushHistorySnapshot();
    setDesks(prev => {
      const idx = prev.findIndex(d => d.id === id);
      if (idx < 0 || idx === prev.length - 1) return prev;
      const newArr = [...prev];
      [newArr[idx], newArr[idx + 1]] = [newArr[idx + 1], newArr[idx]];
      return newArr;
    });
    closeContextMenu();
  };
  const moveBackward = (id: string) => {
    pushHistorySnapshot();
    setDesks(prev => {
      const idx = prev.findIndex(d => d.id === id);
      if (idx <= 0) return prev;
      const newArr = [...prev];
      [newArr[idx], newArr[idx - 1]] = [newArr[idx - 1], newArr[idx]];
      return newArr;
    });
    closeContextMenu();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSelectAllPlaced();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedIds, desks, handleRedo, handleUndo]);

  // close context menu when clicking anywhere else
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => closeContextMenu();
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [contextMenu]);

  // Handler para cambiar el modo activo
  const handleModeChange = (mode: 'add' | 'edit' | 'view') => {
    setActiveMode(mode);
  };

  // cerrar selecciones al cambiar modo o entrar en vista
  useEffect(() => {
    closeContextMenu();
    setSelectedId(null);
    setSelectedIds([]);
    setDraggingId(null);
    setResizingId(null);
    resetHistory();
  }, [activeMode, isViewOnly]);

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
          resetHistory();
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
  const handleDeleteItem = (id: string, recordHistory = true) => {
    if (recordHistory) {
      pushHistorySnapshot();
    }
    setDesks(prev => {
      const item = prev.find(d => d.id === id);
      if (!item) return prev;

      if (item.type === 'desk') {
        // Si es un escritorio, lo mandamos al inventario (placed: false)
        return prev.map(d => 
          d.id === id ? { ...d, placed: false, x: null, y: null } : d
        );
      } else {
        // Si es un objeto decorativo (zona/marco), lo eliminamos de la lista
        return prev.filter(d => d.id !== id);
      }
    });
    
    setSelectedId(null);
    setSelectedIds([]);
    setDraggingId(null);
    setGroupDragStart(null);
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
                    onContextMenu={handleItemContextMenu}
                    onCanvasClick={() => { setSelectedId(null); setSelectedIds([]); closeContextMenu(); }}
                    onSelect={handleSelectItem}
                    onMarqueeSelection={handleMarqueeSelection}
                    selectedId={selectedId}
                    selectedIds={selectedIds}
                    smartGuides={EMPTY_SMART_GUIDES}
                    scale={scale}
                    isReadOnly={true}
                    activeItemId={(draggingId || resizingId || selectedId) || undefined}
                    onItemClick={handleDeskClick}
                  />
                  {contextMenu && (
                    <div
                      className="fixed bg-white border shadow-md rounded z-50 text-sm"
                      style={{ top: contextMenu.clientY, left: contextMenu.clientX }}
                    >
                      <button className="block px-3 py-1 w-full text-left hover:bg-gray-100" onClick={() => deleteItem(contextMenu.id)}>Delete</button>
                      <button className="block px-3 py-1 w-full text-left hover:bg-gray-100" onClick={() => moveForward(contextMenu.id)}>Bring forward</button>
                      <button className="block px-3 py-1 w-full text-left hover:bg-gray-100" onClick={() => moveBackward(contextMenu.id)}>Send backward</button>
                      <button className="block px-3 py-1 w-full text-left hover:bg-gray-100" onClick={() => moveToFront(contextMenu.id)}>Bring to front</button>
                      <button className="block px-3 py-1 w-full text-left hover:bg-gray-100" onClick={() => moveToBack(contextMenu.id)}>Send to back</button>
                    </div>
                  )}

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
            onContextMenu={handleItemContextMenu}
            onCanvasClick={() => { setSelectedId(null); setSelectedIds([]); closeContextMenu(); }}
            onSelect={handleSelectItem}
            onMarqueeSelection={handleMarqueeSelection}
            selectedId={selectedId}
            selectedIds={selectedIds}
            smartGuides={EMPTY_SMART_GUIDES}
            scale={scale}
            isReadOnly={true}
            activeItemId={(draggingId || resizingId || selectedId) || undefined}
            onItemClick={handleDeskClick}
          />
          {contextMenu && (
            <div
              className="fixed bg-white border shadow-md rounded z-50 text-sm"
              style={{ top: contextMenu.clientY, left: contextMenu.clientX }}
              onMouseLeave={closeContextMenu}
            >
              <button className="block px-3 py-1 w-full text-left hover:bg-gray-100" onClick={() => deleteItem(contextMenu.id)}>Delete</button>
              <button className="block px-3 py-1 w-full text-left hover:bg-gray-100" onClick={() => moveForward(contextMenu.id)}>Bring forward</button>
              <button className="block px-3 py-1 w-full text-left hover:bg-gray-100" onClick={() => moveBackward(contextMenu.id)}>Send backward</button>
              <button className="block px-3 py-1 w-full text-left hover:bg-gray-100" onClick={() => moveToFront(contextMenu.id)}>Bring to front</button>
              <button className="block px-3 py-1 w-full text-left hover:bg-gray-100" onClick={() => moveToBack(contextMenu.id)}>Send to back</button>
            </div>
          )}

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
          <Button
            type="button"
            variant="outline"
            onClick={handleSelectAllPlaced}
            disabled={items.length + bgLayers.length === 0}
          >
            Select all
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedId(null);
              setSelectedIds([]);
              setGroupDragStart(null);
            }}
            disabled={selectedIds.length === 0 && !selectedId}
          >
            Clear selection
          </Button>
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
            onContextMenu={handleItemContextMenu}
            onCanvasClick={() => { setSelectedId(null); setSelectedIds([]); closeContextMenu(); }}
            onSelect={handleSelectItem}
            onMarqueeSelection={handleMarqueeSelection}
            selectedId={selectedId}
            selectedIds={selectedIds}
            smartGuides={smartGuides}
            scale={scale}
            isReadOnly={false}
            activeItemId={(draggingId || resizingId || selectedId) || undefined}
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
