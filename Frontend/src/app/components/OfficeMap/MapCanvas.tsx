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

/**
 * Interfaz que define la estructura de un elemento (escritorio u objeto)
 * Representa cada item que puede ser放置 (colocado) en el mapa
 */
interface DeskItem {
  /** Identificador único del elemento */
  id: string;
  /** Posición X del elemento en el canvas */
  x: number;
  /** Posición Y del elemento en el canvas */
  y: number;
  /** Ancho del elemento en píxeles */
  width: number;
  /** Alto del elemento en píxeles */
  height: number;
  /** Tipo de elemento ('desk', 'zone', 'frame', 'store', 'management', 'entrance') */
  type: string;
  /** Indica si el elemento está colocado en el mapa */
  placed: boolean;
  /** Indica si el elemento tiene reportes activos (opcional) */
  hasReport?: boolean;
  /** Estado actual del puesto: 'Available', 'Not available', 'Available with issues' */
  currentStatus?: string;
  /** Indica si es un objeto por defecto */
  isDefault?: boolean;
}

/**
 * Interfaz de props para el componente MapCanvas
 * Define todos los parámetros que el componente padre debe proporcionar
 */
interface MapCanvasProps {
  /** Array de elementos que ya están colocados en el mapa (escritorios) */
  items: DeskItem[];
  /** Array de capas de fondo (zonas, marcos) */
  bgLayers: DeskItem[];
  /** Array de elementos pendientes (sin colocar) */
  inventory: DeskItem[];
  /** Ancho del canvas SVG en píxeles */
  CANVAS_WIDTH: number;
  /** Alto del canvas SVG en píxeles */
  CANVAS_HEIGHT: number;
  /** Callback ejecutado cuando se suelta un elemento arrastrado sobre el canvas */
  onDrop: (e: React.DragEvent) => void;
  /** Callback ejecutado cuando el mouse se mueve sobre el canvas */
  onMouseMove: (e: React.MouseEvent) => void;
  /**
   * Callback ejecutado cuando se hace clic en un elemento del mapa.
   * Recibe además el offset del cursor respecto a la esquina superior izquierda
   * del elemento (se calcula con base en la posición dentro del canvas SVG).
   */
  onMouseDown: (
    id: string,
    offsetX: number,
    offsetY: number
  ) => void;
  /**
   * Callback ejecutado cuando se inicia el redimensionamiento. Se pasa también
   * la posición del cursor dentro del canvas para que el padre pueda calcular
   * el ancho/alto nuevo correctamente.
   */
  onResizeStart?: (
    id: string,
    mouseX: number,
    mouseY: number
  ) => void;
  /** Se dispara al hacer clic sobre el fondo (área sin elementos). */
  onCanvasClick?: () => void;
  /** Se dispara al hacer click derecho sobre un elemento. */
  onContextMenu?: (
    id: string,
    e: React.MouseEvent<SVGElement, MouseEvent>
  ) => void;
  /** Identificador del item que actualmente está activo (arrastrando, seleccionado, etc.). */
  activeItemId?: string;
  /** Callback para eliminar un item */
  onDeleteItem?: (id: string) => void;
  /** Escala actual del canvas (para zoom) */
  scale?: number;
  /** Indica si el canvas está en modo solo lectura */
  isReadOnly?: boolean;
  /** Callback cuando se hace clic en un item */
  onItemClick?: (id: string) => void;
  /** Callback cuando se selecciona un item */
  onSelect?: (id: string) => void;
  /** ID del item seleccionado */
  selectedId?: string | null;
}

/**
 * Función para obtener el color de relleno según el tipo de elemento
 * Cada tipo de elemento tiene un color distintivo para mejor visualización
 */
const getFillColor = (item: DeskItem): string => {
  if (item.type === 'desk') {
    const status = item.currentStatus ?? (item.hasReport ? 'Not available' : 'Available');
    if (status === 'Not available') return "#EF4444";       // Rojo
    if (status === 'Available with issues') return "#F97316"; // Naranja
    return "#22C55E"; // Verde
  }
  // Para los diferentes tipos de objetos/zonas
  switch (item.type) {
    case 'zone':
      return "#6B7280"; // Gris oscuro
    case 'frame':
      return "rgba(156, 163, 175, 0.5)"; // Gris translúcido
    case 'store':
      return "#F59E0B"; // Amarillo/Naranja
    case 'management':
      return "#EAB308"; // Amarillo
    case 'entrance':
      return "#3B82F6"; // Azul
    default:
      return "#22C55E"; // Verde por defecto
  }
};

/**
 * Componente funcional que renderiza el canvas del mapa de oficinas
 * Utiliza SVG para dibujar la cuadrícula y los elementos placed
 * 
 * @param props - Propiedades del componente conteniendo datos y handlers
 * @returns JSX.Element - Componente canvas con elementos SVG
 */
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
  scale = 1,
  isReadOnly = false,
  onItemClick,
  onCanvasClick,
  onContextMenu,
  activeItemId,
  onSelect,
  selectedId,
}: MapCanvasProps) {
  // Referencia al elemento SVG para obtener dimensiones y posiciones
  const svgRef = useRef<SVGSVGElement>(null);
  // Referencia al div contenedor para pan
  const containerRef = useRef<HTMLDivElement>(null);
  // Estado para panning
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  return (
    // Contenedor principal: Card que ocupa el espacio restante (flex-1)
    <Card className="flex-1 relative overflow-hidden bg-white shadow-inner">
      
      {/* Badges superiores derechos: contadores de elementos */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {/* Badge verde: elementos ubicados/colocados */}
        <Badge className="bg-green-600 text-white border-none">
          {items.length + bgLayers.length} Located
        </Badge>
        {/* Badge outline: elementos pendientes */}
        <Badge variant="outline">
          {inventory.length} Pending
        </Badge>
      </div>

      {/* Área del canvas: manejo de drop y mouse */}
      <div
        ref={containerRef}
        className={`w-full h-full overflow-auto ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onDrop={isReadOnly ? undefined : onDrop}
        onDragOver={isReadOnly ? undefined : (e) => e.preventDefault()} // Necesario para permitir drop
        onMouseMove={(e) => {
          if (isPanning && containerRef.current) {
            const deltaX = panStart.x - e.clientX;
            const deltaY = panStart.y - e.clientY;
            containerRef.current.scrollLeft += deltaX;
            containerRef.current.scrollTop += deltaY;
            setPanStart({ x: e.clientX, y: e.clientY });
          }
          onMouseMove(e);
        }}
        onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
          if (e.button === 2) {
            e.preventDefault(); // Previene comportamientos raros del navegador
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY }); // Corregido: ya no usa variables inexistentes
            onCanvasClick?.();
          }
        }}
        onMouseUp={() => setIsPanning(false)}
        onMouseLeave={() => setIsPanning(false)}
      >
        {/* Elemento SVG principal del canvas */}
        <svg 
          ref={svgRef} 
          width={CANVAS_WIDTH * scale}
          height={CANVAS_HEIGHT * scale}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Envolvemos todo en un grupo (g) que aplica el zoom visualmente */}
          <g transform={`scale(${scale})`}>
            {/* Definiciones SVG: patrones y filtros */}
            <defs>
              {/* Patrón de cuadrícula de puntos */}
              <pattern id="dotGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="#64748B" />
              </pattern>
            </defs>
            
            {/* Rectángulo de fondo con patrón de cuadrícula - Usamos dimensiones absolutas */}
            <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#dotGrid)" />

          {/* Renderizado de capas de fondo (zonas, marcos) - SE RENDERIZAN PRIMERO */}
          {bgLayers.map(layer => (
            // Grupo SVG para cada capa de fondo
            <g key={layer.id} transform={`translate(${layer.x}, ${layer.y})`}>
              {/* Rectángulo de la capa de fondo con color según tipo */}
              {(() => {
                const isActive = activeItemId === layer.id;
                return (
                  <rect
                    width={layer.width}
                    height={layer.height}
                    fill={getFillColor(layer)}
                    rx={6} // Bordes más redondeados para zonas
                    stroke={isActive ? '#0284c7' : undefined}
                    strokeWidth={isActive ? 3 : 2}
                    onMouseDown={isReadOnly ? undefined : (e) => {
                      e.stopPropagation();
                      if (e.button === 2) return;

                      if (!svgRef.current) return;
                      const container = svgRef.current.parentElement;
                      if (!container) return;

                      const rect = container.getBoundingClientRect();
                      const mouseX = (e.clientX - rect.left + container.scrollLeft) / scale;
                      const mouseY = (e.clientY - rect.top + container.scrollTop) / scale;
                      
                      const offsetX = mouseX - layer.x;
                      const offsetY = mouseY - layer.y;
                      
                      onSelect?.(layer.id);
                      onMouseDown(layer.id, offsetX, offsetY);
                    }} // Iniciar arrastre
                    className={isReadOnly ? '' : 'cursor-move'} // Cursor de movimiento
                    onContextMenu={isReadOnly ? undefined : (e) => { e.preventDefault(); e.stopPropagation(); onContextMenu?.(layer.id, e); }}
                  />
                );
              })()}
              {/* Texto con el ID del elemento centrado tambien sentencias de que los tres objetos tienen nombre y 2 sin */}
              {layer.type !== "zone" && layer.type !== "frame" && (
              <text
                x={layer.width / 2}
                y={layer.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                className="text-xs font-bold pointer-events-none"
              >
                {layer.id.split("-").slice(0, -1).join("-")}
              </text>
            )}
              
              {/* Botón de eliminar (X) en la esquina superior derecha */}
              {!isReadOnly && (
                <>
                  <circle
                    cx={layer.width - 6}
                    cy={6}
                    r={5}
                    fill="#EF4444"
                    className="cursor-pointer hover:fill-red-700 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem?.(layer.id);
                    }}
                  />
                  <text
                    x={layer.width - 6}
                    y={6}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    className="text-xs font-bold pointer-events-none select-none"
                  >
                    ×
                  </text>
                </>
              )}

              {/* Handle de redimensionamiento (esquina inferior derecha) */}
              {!isReadOnly && (
                <rect
                  x={layer.width - 7.5}
                  y={layer.height - 7.5}
                  width={10}
                  height={10}
                  rx={7}
                  fill="white"
                  stroke="#374151"
                  strokeWidth={1}
                  className="cursor-se-resize"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (!svgRef.current) return;
                    const container = svgRef.current.parentElement;
                    if (!container) return;
                    
                    const rect = container.getBoundingClientRect();
                    const mouseX = (e.clientX - rect.left + container.scrollLeft) / scale;
                    const mouseY = (e.clientY - rect.top + container.scrollTop) / scale;
                    
                    // Fíjate que quitamos la "e" de aquí adentro
                    onResizeStart?.(layer.id, mouseX, mouseY);
                  }}
                />
              )}
            </g>
          ))}

          {/* Renderizado de escritorios/items en el mapa */}
          {items.map(item => (
            // Grupo SVG para cada elemento
            <g key={item.id} transform={`translate(${item.x}, ${item.y})`}>
              {/* Rectángulo del elemento: verde si OK, rojo si tiene reportes */}
              {(() => {
                const isActive = activeItemId === item.id;
                return (
                  <rect
                    width={item.width}
                    height={item.height}
                    fill={getFillColor(item)}
                    rx={8} // Bordes redondeados
                    stroke={selectedId === item.id ? "#3B82F6" : "none"}
                    strokeWidth={selectedId === item.id ? 2 : 0}
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
                      
                      // Seleccionamos el objeto y luego iniciamos el arrastre
                      onSelect?.(item.id); 
                      onMouseDown(item.id, offsetX, offsetY);
                    

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

              {/* Botón de eliminar (X) en la esquina superior derecha */}
              {!isReadOnly && (
                <>
                  <circle
                    cx={item.width - 6}
                    cy={6}
                    r={5}
                    fill="#EF4444"
                    className="cursor-pointer hover:fill-red-700 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem?.(item.id);
                    }}
                  />
                  <text
                    x={item.width - 6}
                    y={6}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    className="text-xs font-bold pointer-events-none select-none"
                  >
                    ×
                  </text>
                </>
              )}

              {/* Handle de redimensionamiento (esquina inferior derecha) */}
              {!isReadOnly && item.type !== 'desk' && (
                <rect
                  x={item.width - 8}
                  y={item.height - 8}
                  width={12}
                  height={12}
                  rx={2}
                  fill="#3B82F6"
                  stroke="white"
                  strokeWidth={1}
                  className="cursor-se-resize hover:fill-blue-600 transition"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (!svgRef.current) return;
                    const container = svgRef.current.parentElement;
                    if (!container) return;
                    
                    const rect = container.getBoundingClientRect();
                    const mouseX = (e.clientX - rect.left + container.scrollLeft) / scale;
                    const mouseY = (e.clientY - rect.top + container.scrollTop) / scale;
                    
                    // Fíjate que también quitamos la "e" de aquí
                    onResizeStart?.(item.id, mouseX, mouseY);
                  }}
                />
              )}
            </g>
          ))}
          </g>
        </svg>
      </div>
    </Card>
  );
}