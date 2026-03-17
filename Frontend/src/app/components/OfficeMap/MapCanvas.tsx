/**
 * Componente: MapCanvas
 * 
 * Descripción:
 * Este componente representa el área principal (canvas) del mapa de oficinas donde
 * se visualizan y manipulan los escritorios y objetos. Utiliza SVG para renderizar
 * los elementos con una cuadrícula de fondo y permite operaciones de drag-and-drop.
 * 
 * Funcionalidades:
 * - Renderizado de una cuadrícula de fondo (dot grid) usando SVG pattern
 * - Visualización de elementos placed (escritorios) como rectángulos coloreados
 * - Capas de fondo para zonas y marcos con colores específicos
 * - Sistema de badges para mostrar contadores de elementos
 * - Manejo de eventos de arrastre (drop) desde el sidebar
 * - Movimiento del mouse para detectar posición en el canvas
 * - Colores diferenciados según tipo de elemento:
 *   - zone: gris oscuro
 *   - frame: gris translúcido
 *   - store: amarillo
 *   - management: amarillo/naranja
 *   - entrance: azul
 *   - desk (con reportes): rojo
 *   - desk (sin reportes): verde
 * 
 * Props:
 * - items: Array de elementos que están placed en el mapa (escritorios)
 * - bgLayers: Array de capas de fondo (zonas, marcos)
 * - inventory: Array de elementos pendientes (sin colocar)
 * - CANVAS_WIDTH: Ancho del área SVG en píxeles
 * - CANVAS_HEIGHT: Alto del área SVG en píxeles
 * - onDrop: Función callback cuando se suelta un elemento arrastrado
 * - onMouseMove: Función callback cuando se mueve el mouse sobre el canvas
 * - onMouseDown: Función callback cuando se hace clic en un elemento del mapa
 * - onResizeStart: Función callback para iniciar el redimensionamiento
 * 
 * Dependencias:
 * - react: useRef para referencias al elemento SVG
 * - ../ui/card: Componente Card
 * - ../ui/badge: Componente Badge para indicadores
 */

import { useRef, useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface Point {
  x: number;
  y: number;
}

interface SmartGuideLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  kind: 'alignment' | 'distance';
}

interface SmartGuideLabel {
  x: number;
  y: number;
  text: string;
}

interface SmartGuides {
  lines: SmartGuideLine[];
  labels: SmartGuideLabel[];
}

const EMPTY_SMART_GUIDES: SmartGuides = {
  lines: [],
  labels: [],
};

interface DeskItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  placed: boolean;
  hasReport?: boolean;
  currentStatus?: string;
  isDefault?: boolean;
}

interface MapCanvasProps {
  items: DeskItem[];
  bgLayers: DeskItem[];
  inventory: DeskItem[];
  CANVAS_WIDTH: number;
  CANVAS_HEIGHT: number;
  onDrop: (e: React.DragEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseDown: (
    id: string,
    offsetX: number,
    offsetY: number,
    mouseX: number,
    mouseY: number,
    appendToSelection?: boolean
  ) => void;
  onResizeStart?: (id: string, mouseX: number, mouseY: number) => void;
  onCanvasClick?: () => void;
  onContextMenu?: (id: string, e: React.MouseEvent<SVGElement, MouseEvent>) => void;
  activeItemId?: string;
  onDeleteItem?: (id: string) => void;
  scale?: number;
  isReadOnly?: boolean;
  onItemClick?: (id: string) => void;
  onSelect?: (id: string, appendToSelection?: boolean) => void;
  selectedId?: string | null;
  selectedIds?: string[];
  onMarqueeSelection?: (ids: string[]) => void;
  smartGuides?: SmartGuides;
  // ESTA ES LA PROP QUE SOLUCIONA EL ERROR DE LA IMAGEN:
  onRenameItem?: (id: string, newName: string) => void; 
}

const intersects = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean => {
  return !(a.x + a.width < b.x || b.x + b.width < a.x || a.y + a.height < b.y || b.y + b.height < a.y);
};

const getFillColor = (item: DeskItem): string => {
  if (item.type === 'desk') {
    const status = item.currentStatus ?? (item.hasReport ? 'Not available' : 'Available');
    if (status === 'Not available') return "#EF4444";
    if (status === 'Available with issues') return "#F97316";
    return "#22C55E";
  }
  switch (item.type) {
    case 'zone': return "#6B7280";
    case 'frame': return "rgba(156, 163, 175, 0.5)";
    case 'store': return "#F59E0B";
    case 'management': return "#EAB308";
    case 'entrance': return "#3B82F6";
    default: return "#22C55E";
  }
};

export default function MapCanvas({
  items,
  bgLayers,
  inventory,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  onDrop,
  onMouseMove,
  onMouseDown,
  onResizeStart,
  onDeleteItem,
  onRenameItem,
  scale = 1,
  isReadOnly = false,
  onItemClick,
  onCanvasClick,
  onContextMenu,
  activeItemId,
  onSelect,
  selectedId,
  selectedIds = [],
  onMarqueeSelection,
  smartGuides = EMPTY_SMART_GUIDES,
}: MapCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<Point | null>(null);

  const getMousePosition = (e: React.MouseEvent): Point | null => {
    if (!svgRef.current) return null;
    const container = svgRef.current.parentElement;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left + container.scrollLeft) / scale,
      y: (e.clientY - rect.top + container.scrollTop) / scale,
    };
  };

  const handleFinishEdit = (id: string) => {
    const trimmed = editValue.trim();
    if (trimmed !== "" && trimmed !== id) {
      onRenameItem?.(id, trimmed);
    }
    setEditingId(null);
  };

  const getSelectionRect = () => {
    if (!selectionStart || !selectionCurrent) return null;
    return {
      x: Math.min(selectionStart.x, selectionCurrent.x),
      y: Math.min(selectionStart.y, selectionCurrent.y),
      width: Math.abs(selectionCurrent.x - selectionStart.x),
      height: Math.abs(selectionCurrent.y - selectionStart.y),
    };
  };

  const getPlacedElements = (): DeskItem[] => [...bgLayers, ...items].filter((el) => el.placed && el.x != null && el.y != null);

  const updateMarqueeSelection = (rect: { x: number; y: number; width: number; height: number }) => {
    const selected = getPlacedElements()
      .filter((el) => intersects({ x: el.x, y: el.y, width: el.width, height: el.height }, rect))
      .map((el) => el.id);
    onMarqueeSelection?.(selected);
  };

  const finishMarqueeSelection = () => {
    const rect = getSelectionRect();
    if (!rect) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionCurrent(null);
      return;
    }
    if (rect.width < 4 && rect.height < 4) {
      onCanvasClick?.();
    } else {
      updateMarqueeSelection(rect);
    }
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionCurrent(null);
  };

  return (
    <Card className="flex-1 relative overflow-hidden bg-white shadow-inner">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Badge className="bg-green-600 text-white border-none">{items.length + bgLayers.length} Located</Badge>
        <Badge variant="outline">{inventory.length} Pending</Badge>
      </div>

      <div
        ref={containerRef}
        className={`w-full h-full overflow-auto ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onDrop={isReadOnly ? undefined : onDrop}
        onDragOver={isReadOnly ? undefined : (e) => e.preventDefault()}
        onMouseMove={(e) => {
          if (isPanning && containerRef.current) {
            const deltaX = panStart.x - e.clientX;
            const deltaY = panStart.y - e.clientY;
            containerRef.current.scrollLeft += deltaX;
            containerRef.current.scrollTop += deltaY;
            setPanStart({ x: e.clientX, y: e.clientY });
          }
          if (isSelecting) {
            const point = getMousePosition(e);
            if (point && selectionStart) {
              setSelectionCurrent(point);
              updateMarqueeSelection(getSelectionRect()!);
            }
          }
          onMouseMove(e);
        }}
        onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
          if (e.button === 2) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
            onCanvasClick?.();
          }
        }}
        onMouseUp={() => {
          setIsPanning(false);
          if (isSelecting) finishMarqueeSelection();
        }}
        onMouseLeave={() => {
          setIsPanning(false);
          if (isSelecting) finishMarqueeSelection();
        }}
      >
        <svg 
          ref={svgRef} 
          width={CANVAS_WIDTH * scale}
          height={CANVAS_HEIGHT * scale}
          onContextMenu={(e) => e.preventDefault()}
          onMouseDown={isReadOnly ? undefined : (e) => {
            if (e.button !== 0) return;
            const point = getMousePosition(e);
            if (!point) return;
            if (editingId) handleFinishEdit(editingId);
            setIsSelecting(true);
            setSelectionStart(point);
            setSelectionCurrent(point);
          }}
        >
          <g transform={`scale(${scale})`}>
            <defs>
              <pattern id="dotGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="#64748B" />
              </pattern>
            </defs>
            <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#dotGrid)" />

            {bgLayers.map(layer => (
              <g key={layer.id} transform={`translate(${layer.x}, ${layer.y})`}>
                <rect
                  width={layer.width}
                  height={layer.height}
                  fill={getFillColor(layer)}
                  rx={6}
                  stroke={activeItemId === layer.id ? '#0284c7' : (selectedIds.includes(layer.id) || selectedId === layer.id ? '#3B82F6' : undefined)}
                  strokeWidth={activeItemId === layer.id ? 3 : 2}
                  onMouseDown={isReadOnly ? undefined : (e) => {
                    if (editingId === layer.id) return;
                    e.stopPropagation();
                    if (e.button === 2) return;
                    const point = getMousePosition(e);
                    if (!point) return;
                    onSelect?.(layer.id, e.ctrlKey || e.metaKey || e.shiftKey);
                    onMouseDown(layer.id, point.x - layer.x, point.y - layer.y, point.x, point.y, e.ctrlKey || e.metaKey || e.shiftKey);
                  }}
                  onDoubleClick={(e) => {
                    if (isReadOnly) return;
                    e.stopPropagation();
                    setEditingId(layer.id);
                    setEditValue(layer.id.split("-").slice(0, -1).join("-") || layer.id);
                  }}
                  className={isReadOnly ? '' : 'cursor-move'}
                  onContextMenu={isReadOnly ? undefined : (e) => { e.preventDefault(); e.stopPropagation(); onContextMenu?.(layer.id, e); }}
                />
                
                {layer.type !== "zone" && layer.type !== "frame" && (
                  editingId === layer.id ? (
                    <foreignObject x={5} y={layer.height / 2 - 12} width={layer.width - 10} height={24}>
                      <input
                        autoFocus
                        className="w-full h-full text-[10px] text-center font-bold border border-blue-500 outline-none rounded bg-white text-black z-50 shadow-md"
                        style={{ pointerEvents: 'auto' }}
                        value={editValue}
                        onMouseDown={(e) => e.stopPropagation()}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleFinishEdit(layer.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFinishEdit(layer.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                    </foreignObject>
                  ) : (
                    <text
                      x={layer.width / 2}
                      y={layer.height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      className="text-xs font-bold pointer-events-none"
                    >
                      {layer.id.split("-").slice(0, -1).join("-") || layer.id}
                    </text>
                  )
                )}
                
                {!isReadOnly && (
                  <>
                    <circle cx={layer.width - 6} cy={6} r={5} fill="#EF4444" className="cursor-pointer hover:fill-red-700" onClick={(e) => { e.stopPropagation(); onDeleteItem?.(layer.id); }} />
                    <text x={layer.width - 6} y={6} textAnchor="middle" dominantBaseline="middle" fill="white" className="text-xs font-bold pointer-events-none">×</text>
                    <rect x={layer.width - 7.5} y={layer.height - 7.5} width={10} height={10} rx={7} fill="white" stroke="#374151" className="cursor-se-resize" onMouseDown={(e) => { e.stopPropagation(); const point = getMousePosition(e); if (point) onResizeStart?.(layer.id, point.x, point.y); }} />
                  </>
                )}
              </g>
            ))}

            {items.map(item => (
              <g key={item.id} transform={`translate(${item.x}, ${item.y})`}>
                <rect
                  width={item.width}
                  height={item.height}
                  fill={getFillColor(item)}
                  rx={8}
                  stroke={selectedIds.includes(item.id) || selectedId === item.id ? "#3B82F6" : "none"}
                  strokeWidth={2}
                  onMouseDown={isReadOnly ? undefined : (e) => {
                    if (editingId === item.id) return;
                    e.stopPropagation();
                    const point = getMousePosition(e);
                    if (point) {
                      onSelect?.(item.id, e.ctrlKey || e.metaKey || e.shiftKey); 
                      onMouseDown(item.id, point.x - item.x, point.y - item.y, point.x, point.y, e.ctrlKey || e.metaKey || e.shiftKey);
                    }
                  }}
                  onDoubleClick={(e) => {
                    if (isReadOnly) return;
                    e.stopPropagation();
                    setEditingId(item.id);
                    setEditValue(item.id);
                  }}
                  className={isReadOnly ? 'cursor-pointer' : 'cursor-move'}
                  onContextMenu={isReadOnly ? undefined : (e) => { e.preventDefault(); e.stopPropagation(); onContextMenu?.(item.id, e); }}
                />

                {editingId === item.id ? (
                  <foreignObject x={5} y={item.height / 2 - 12} width={item.width - 10} height={24}>
                    <input
                      autoFocus
                      className="w-full h-full text-[10px] text-center font-bold border border-blue-500 outline-none rounded bg-white text-black z-50 shadow-md"
                      style={{ pointerEvents: 'auto' }}
                      value={editValue}
                      onMouseDown={(e) => e.stopPropagation()}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleFinishEdit(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleFinishEdit(item.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                  </foreignObject>
                ) : (
                  <text x={item.width / 2} y={item.height / 2} textAnchor="middle" dominantBaseline="middle" fill="white" className="text-[10px] font-bold pointer-events-none">
                    {item.id}
                  </text>
                )}

                {!isReadOnly && (
                  <>
                    <circle cx={item.width - 6} cy={6} r={5} fill="#EF4444" className="cursor-pointer hover:fill-red-700" onClick={(e) => { e.stopPropagation(); onDeleteItem?.(item.id); }} />
                    <text x={item.width - 6} y={6} textAnchor="middle" dominantBaseline="middle" fill="white" className="text-xs font-bold pointer-events-none">×</text>
                    {(selectedId === item.id || selectedIds.includes(item.id)) && item.type !== 'desk' && (
                      <rect x={item.width - 8} y={item.height - 8} width={12} height={12} rx={2} fill="#3B82F6" stroke="white" className="cursor-se-resize" onMouseDown={(e) => { e.stopPropagation(); const point = getMousePosition(e); if (point) onResizeStart?.(item.id, point.x, point.y); }} />
                    )}
                  </>
                )}
              </g>
            ))}

            {smartGuides.lines.map((line, index) => (
              <line key={`guide-${index}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#9333EA" strokeWidth={line.kind === 'alignment' ? 1.75 : 1.25} strokeDasharray={line.kind === 'alignment' ? undefined : '5 4'} pointerEvents="none" />
            ))}

            {smartGuides.labels.map((label, index) => {
              const boxWidth = Math.max(40, label.text.length * 7 + 12);
              return (
                <g key={`label-${index}`} pointerEvents="none">
                  <rect x={label.x - boxWidth / 2} y={label.y - 11} width={boxWidth} height={18} rx={6} fill="#F3E8FF" stroke="#C084FC" strokeWidth={1} />
                  <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fill="#6B21A8" style={{ fontSize: 10, fontWeight: 700 }}>{label.text}</text>
                </g>
              );
            })}

            {isSelecting && (
              (() => {
                const rect = getSelectionRect();
                return rect ? <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill="rgba(59, 130, 246, 0.12)" stroke="#2563EB" strokeWidth={1.5} strokeDasharray="6 4" pointerEvents="none" /> : null;
              })()
            )}
          </g>
        </svg>
      </div>
    </Card>
  );
}