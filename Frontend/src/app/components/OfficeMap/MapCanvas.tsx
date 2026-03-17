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
  /** Callback para renombrar un elemento */
  onRenameItem?: (id: string, newName: string) => void;
}

const intersects = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
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
  activeItemId,
  onSelect,
  selectedId,
  selectedIds = [],
  onMarqueeSelection,
}: MapCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Estados para la edición de nombres ---
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
    if (editValue.trim() !== "" && editValue !== id) {
      onRenameItem?.(id, editValue.trim());
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
        onMouseDown={(e) => {
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
            // Si estábamos editando y clicamos fuera, terminamos
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

            {/* Renderizado de capas de fondo */}
            {bgLayers.map(layer => (
              <g key={layer.id} transform={`translate(${layer.x}, ${layer.y})`}>
                <rect
                  width={layer.width}
                  height={layer.height}
                  fill={getFillColor(layer)}
                  rx={6}
                  stroke={activeItemId === layer.id ? '#0284c7' : (selectedIds.includes(layer.id) || selectedId === layer.id ? '#3B82F6' : undefined)}
                  strokeWidth={activeItemId === layer.id ? 3 : 2}
                  onMouseDown={(e) => {
                    if (isReadOnly || editingId === layer.id) return;
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
                />
                
                {/* Texto / Input para bgLayers */}
                {layer.type !== "zone" && layer.type !== "frame" && (
                  editingId === layer.id ? (
                    <foreignObject x={5} y={layer.height / 2 - 10} width={layer.width - 10} height={20}>
                      <input
                        autoFocus
                        className="w-full h-full text-[10px] text-center font-bold border-none outline-none rounded bg-white text-black shadow-sm"
                        value={editValue}
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

                {/* Botón eliminar y handle de redimensionado para bgLayers se mantienen igual */}
                {!isReadOnly && (
                  <>
                    <circle
                      cx={layer.width - 6} cy={6} r={5} fill="#EF4444"
                      className="cursor-pointer hover:fill-red-700 transition"
                      onClick={(e) => { e.stopPropagation(); onDeleteItem?.(layer.id); }}
                    />
                    <text x={layer.width - 6} y={6} textAnchor="middle" dominantBaseline="middle" fill="white" className="text-xs font-bold pointer-events-none select-none">×</text>
                    <rect
                      x={layer.width - 7.5} y={layer.height - 7.5} width={10} height={10} rx={7}
                      fill="white" stroke="#374151" strokeWidth={1} className="cursor-se-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const point = getMousePosition(e);
                        if (point) onResizeStart?.(layer.id, point.x, point.y);
                      }}
                    />
                  </>
                )}
              </g>
            ))}

          {/* Renderizado de escritorios/items en el mapa */}
          {items.map(item => (
            // Grupo SVG para cada elemento
            <g key={item.id} transform={`translate(${item.x}, ${item.y})`}>
              {/* Rectángulo del elemento: verde si OK, rojo si tiene reportes */}
              {(() => {
                return (
                  <rect
                    width={item.width}
                    height={item.height}
                    fill={getFillColor(item)}
                    rx={8} // Bordes redondeados
                    stroke={selectedIds.includes(item.id) || selectedId === item.id ? "#3B82F6" : "none"}
                    strokeWidth={selectedIds.includes(item.id) || selectedId === item.id ? 2 : 0}
                    onMouseDown={isReadOnly ? undefined : (e) => {
                      e.stopPropagation();
                      if (e.button === 2) return;
                      
                      if (!svgRef.current) return;
                      const container = svgRef.current.parentElement;
                      if (!container) return;

                      const rect = container.getBoundingClientRect();
                      const mouseX = (e.clientX - rect.left + container.scrollLeft) / scale;
                      const mouseY = (e.clientY - rect.top + container.scrollTop) / scale;
                      
                      const offsetX = mouseX - item.x;
                      const offsetY = mouseY - item.y;
                      const appendToSelection = e.ctrlKey || e.metaKey || e.shiftKey;
                      
                      // Seleccionamos el objeto y luego iniciamos el arrastre
                      onSelect?.(item.id, appendToSelection); 
                      onMouseDown(item.id, offsetX, offsetY, mouseX, mouseY, appendToSelection);
                    

                    }} // Iniciar arrastre
                    onClick={isReadOnly ? () => onItemClick?.(item.id) : undefined}
                    className={isReadOnly ? 'cursor-pointer' : 'cursor-move'} // Cursor de movimiento
                    onContextMenu={isReadOnly ? undefined : (e) => { e.preventDefault(); e.stopPropagation(); onContextMenu?.(item.id, e); }}
                  />
                );
              })()}
              {/* Texto con el ID del elemento centrado */}
              <text
                x={item.width / 2}
                y={item.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                className="text-[10px] font-bold pointer-events-none"
              >
                {item.id}
              </text>

                {/* Resto de herramientas de edición de items se mantienen igual */}
                {!isReadOnly && (
                  <>
                    <circle
                      cx={item.width - 6} cy={6} r={5} fill="#EF4444"
                      className="cursor-pointer hover:fill-red-700 transition"
                      onClick={(e) => { e.stopPropagation(); onDeleteItem?.(item.id); }}
                    />
                    <text x={item.width - 6} y={6} textAnchor="middle" dominantBaseline="middle" fill="white" className="text-xs font-bold pointer-events-none select-none">×</text>
                    {selectedId === item.id && item.type !== 'desk' && (
                       <rect
                       x={item.width - 8} y={item.height - 8} width={12} height={12} rx={2}
                       fill="#3B82F6" stroke="white" className="cursor-se-resize"
                       onMouseDown={(e) => {
                         e.stopPropagation();
                         const point = getMousePosition(e);
                         if (point) onResizeStart?.(item.id, point.x, point.y);
                       }}
                     />
                    )}
                  </>
                )}
              </g>
            ))}

            {/* Marquee, Guías, etc... */}
            {/* ... */}
          </g>
        </svg>
      </div>
    </Card>
  );
}