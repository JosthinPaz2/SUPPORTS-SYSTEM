/**
 * Componente: MapSidebar
 * 
 * Descripción:
 * Este componente representa el panel lateral (sidebar) del mapa de oficinas.
 * Proporciona una interfaz para gestionar el inventario de escritorios y objetos,
 * incluyendo funcionalidades de búsqueda, filtrado por tabs, importación de archivos
 * y arrastre de elementos hacia el mapa.
 * 
 * Funcionalidades:
 * - Sistema de pestañas (tabs) para cambiar entre "Inventory" y "Objects"
 * - Campo de búsqueda para filtrar elementos por ID
 * - Lista desplazable de elementos que pueden ser arrastrados al mapa
 * - Botón para rotar elementos individualmente
 * - Importación de archivos CSV para cargar datos de escritorios
 * - Diseño responsivo con scroll vertical para listas largas
 * 
 * Props:
 * - search: Valor actual del campo de búsqueda
 * - setSearch: Función para actualizar el valor de búsqueda
 * - inventory: Array de elementos (escritorios/objetos) a mostrar en la lista
 * - activeTab: Pestaña activa actualmente ('inventory' | 'objects')
 * - setActiveTab: Función para cambiar la pestaña activa
 * - onRotateItem: Función callback para rotar un elemento específico
 * - onFileUpload: Función callback para manejar la carga de archivos CSV
 * 
 * Dependencias:
 * - react: useRef para referencias al input file
 * - ../ui/card: Componentes Card, CardHeader, CardContent
 * - ../ui/button: Componente Button
 * - lucide-react: Iconos (Search, GripVertical, RotateCw, Upload, LayoutGrid, Package)
 */

import { useRef } from 'react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Search, GripVertical, RotateCw, Upload, LayoutGrid, Package } from 'lucide-react';

/**
 * Interfaz que define la estructura de un elemento (escritorio u objeto)
 * Representa cada item que puede ser arrastrado al mapa
 */
interface DeskItem {
  /** Identificador único del elemento */
  id: string;
  /** Posición X del elemento en el canvas (null si no está colocado) */
  x: number | null;
  /** Posición Y del elemento en el canvas (null si no está colocado) */
  y: number | null;
  /** Ancho del elemento en píxeles */
  width: number;
  /** Alto del elemento en píxeles */
  height: number;
  /** Tipo de elemento ('desk', 'zone', 'frame', etc.) */
  type: string;
  /** Indica si el elemento ya está colocado en el mapa */
  placed: boolean;
  /** Indica si el elemento tiene reportes activos (opcional) */
  hasReport?: boolean;
}

/**
 * Interfaz de props para el componente MapSidebar
 * Define todos los parámetros que el componente padre debe proporcionar
 */
interface MapSidebarProps {
  /** Valor actual del texto de búsqueda */
  search: string;
  /** Función para actualizar el estado de búsqueda */
  setSearch: (value: string) => void;
  /** Array de elementos de escritorio a mostrar en el inventario */
  inventory: DeskItem[];
  /** Array de objetos (zonas, frames, etc.) a mostrar en la pestaña objects */
  objects: DeskItem[];
  /** Pestaña actualmente activa ('inventory' o 'objects') */
  activeTab: 'inventory' | 'objects';
  /** Función para cambiar la pestaña activa */
  setActiveTab: (tab: 'inventory' | 'objects') => void;
  /** Función callback que se ejecuta cuando se rota un elemento */
  onRotateItem: (id: string) => void;
  /** Función callback que se ejecuta cuando se selecciona un archivo CSV */
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Componente funcional que renderiza el sidebar del mapa de oficinas
 * Incluye pestañas, búsqueda, lista de elementos y botón de importación
 * 
 * @param props - Propiedades del componente conteniendo estados y callbacks
 * @returns JSX.Element - Componente sidebar con toda su funcionalidad
 */
export default function MapSidebar({
  search,
  setSearch,
  inventory,
  objects,
  activeTab,
  setActiveTab,
  onRotateItem,
  onFileUpload,
}: MapSidebarProps) {
  // Referencia al input de tipo file (oculto) para importar CSV
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Maneja el inicio del arrastre de un elemento
   * Guarda los datos del elemento en el objeto dataTransfer para su transferencia
   */
  const handleDragStart = (e: React.DragEvent, item: DeskItem) => {
    e.dataTransfer.setData("objectData", JSON.stringify(item));
  };

  // Determinar qué lista mostrar según la pestaña activa
  const displayedItems = activeTab === 'inventory' ? inventory : objects;

  return (
    // Contenedor principal: Card con ancho fijo de 320px, flex column y overflow oculto
    <Card className="w-80 flex flex-col overflow-hidden">
      {/* Encabezado del sidebar: pestañas y búsqueda */}
      <CardHeader>
        {/* Contenedor de pestañas con estilo de toggle */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          {/* Botón de pestaña Inventory */}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold rounded-lg transition-all ${
              activeTab === 'inventory' ? 'bg-white shadow text-blue-600' : 'text-slate-400'
            }`}
          >
            <LayoutGrid size={14} /> INVENTORY
          </button>
          {/* Botón de pestaña Objects */}
          <button
            onClick={() => setActiveTab('objects')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold rounded-lg transition-all${
              activeTab === 'objects' ? 'bg-white shadow text-blue-600' : 'text-slate-400'
            }`}
          >
            <Package size={14} /> OBJECTS
          </button>
        </div>
        
        {/* Campo de búsqueda con icono */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border rounded-md text-sm"
          />
        </div>
      </CardHeader>

      {/* Lista de elementos del inventario (scrollable) */}
      <CardContent className="flex-1 overflow-y-auto space-y-2">
        {/* Mapeo de cada elemento del inventario */}
        {displayedItems.map(item => (
          <div
            key={item.id}
            // Habilitar arrastre del elemento
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm cursor-grab hover:border-blue-300"
          >
            {/* Sección izquierda: icono de arrastre e ID */}
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-300" />
              <span className="text-sm font-semibold">{item.id}</span>
            </div>
            {/* Botón de rotación del elemento */}
            <RotateCw
              size={14}
              className="text-gray-400 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation(); // Prevenir propagación del evento
                onRotateItem(item.id); // Ejecutar callback de rotación
              }}
            />
          </div>
        ))}
      </CardContent>
      {/* Pie del sidebar: botón de importación CSV */}
      <div className="p-4 border-t">
        {/* Input file oculto que se activa al hacer clic en el botón */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileUpload}
          className="hidden"
        />
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" /> Import CSV
        </Button>
      </div>
    </Card>
  );
}

