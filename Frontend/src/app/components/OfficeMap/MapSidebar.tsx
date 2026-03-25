/**
 Componente: MapSidebar
 
 Descripción:
 Este componente representa el panel lateral (sidebar) del mapa de oficinas.
 Proporciona una interfaz para gestionar el inventario de escritorios y objetos,
 incluyendo funcionalidades de búsqueda, filtrado por tabs, importación de archivos
 y arrastre de elementos hacia el mapa.
 
 Funcionalidades:
 - Sistema de pestañas (tabs) para cambiar entre "Inventory" y "Objects"
 - Campo de búsqueda para filtrar elementos por ID
 - Lista desplazable de elementos que pueden ser arrastrados al mapa
 - Botón para rotar elementos individualmente
 - Importación de archivos CSV para cargar datos de escritorios
 - Diseño responsivo con scroll vertical para listas largas
 
 Props:
 - search: Valor actual del campo de búsqueda
 - setSearch: Función para actualizar el valor de búsqueda
 - inventory: Array de elementos (escritorios/objetos) a mostrar en la lista
 - activeTab: Pestaña activa actualmente ('inventory' | 'objects')
 - setActiveTab: Función para cambiar la pestaña activa
 - onRotateItem: Función callback para rotar un elemento específico
 - onFileUpload: Función callback para manejar la carga de archivos CSV
 
 Dependencias:
 - react: useRef para referencias al input file
 - ../ui/card: Componentes Card, CardHeader, CardContent
 - ../ui/button: Componente Button
 - lucide-react: Iconos (Search, GripVertical, RotateCw, Upload, LayoutGrid, Package)
 */

import { useRef } from 'react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Search, GripVertical, RotateCw, Upload, LayoutGrid, Package } from 'lucide-react';

/**
 Interfaz que define la estructura de un elemento (escritorio u objeto)
 Representa cada item que puede ser arrastrado al mapa
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
  /** Texto visible para algunos objetos decorativos */
  labelText?: string;
}

/**
 Interfaz de props para el componente MapSidebar
 Define todos los parámetros que el componente padre debe proporcionar
 */
interface MapSidebarProps {
  search: string; /** Valor actual del texto de búsqueda */
  setSearch: (value: string) => void; /** Función para actualizar el estado de búsqueda */
  inventory: DeskItem[]; /** Array de elementos de escritorio a mostrar en el inventario */
  objects: DeskItem[]; /** Array de objetos (zonas, frames, etc.) a mostrar en la pestaña objects */
  activeTab: 'inventory' | 'objects'; /** Pestaña actualmente activa ('inventory' o 'objects') */
  setActiveTab: (tab: 'inventory' | 'objects') => void; /** Función para cambiar la pestaña activa */
  onRotateItem: (id: string) => void; /** Función callback que se ejecuta cuando se rota un elemento */
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;  /** Función callback que se ejecuta cuando se selecciona un archivo CSV */
}

/**
 Componente funcional que renderiza el sidebar del mapa de oficinas
 Incluye pestañas, búsqueda, lista de elementos y botón de importación
 
 @param props - Propiedades del componente conteniendo estados y callbacks
 @returns JSX.Element - Componente sidebar con toda su funcionalidad
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

  const getPreviewClasses = (type: string) => {
    switch (type) {
      case 'zone':
        return 'w-7 h-5 rounded bg-slate-500 border border-slate-600';
      case 'frame':
        return 'w-7 h-5 rounded border-2 border-slate-400 bg-transparent';
      case 'store':
        return 'w-7 h-4 rounded bg-amber-500 border border-amber-600';
      case 'management':
        return 'w-7 h-4 rounded bg-yellow-400 border border-yellow-500';
      case 'entrance':
        return 'w-7 h-3 rounded bg-blue-500 border border-blue-600';
      case 'note':
        return 'w-7 h-5 rounded bg-[#E8D8B8] border border-[#D1BE97]';
      default:
        return 'w-7 h-4 rounded bg-emerald-500 border border-emerald-600';
    }
  };

  return (
    // Contenedor principal: Card con ancho fijo de 320px, flex column y overflow oculto
    <Card className="w-80 flex flex-col overflow-hidden bg-card border-border">
      {/* Encabezado del sidebar: pestañas y búsqueda */}
      <CardHeader>
        {/* Contenedor de pestañas con estilo de toggle */}
<div className="flex p-1 bg-muted rounded-xl">
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
            className="w-full pl-9 pr-4 py-2 bg-input border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground"
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
            className="flex items-center justify-between p-3 bg-card rounded-lg shadow-sm cursor-grab hover:border-ring hover:bg-accent border-border"
          >
            {/* Sección izquierda: icono de arrastre e ID */}
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-300" />
              <span className="text-sm font-semibold">{item.id}</span>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'objects' && (
                <div
                  className={`${getPreviewClasses(item.type)} shrink-0`}
                  title={`${item.type} preview`}
                />
              )}

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
          accept=".csv,.txt"
          title="Import CSV file"
          aria-label="Import CSV file"
          className="hidden"
        />
        <Button
          className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          variant="destructive"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" /> Import CSV
        </Button>
      </div>
    </Card>
  );
}

