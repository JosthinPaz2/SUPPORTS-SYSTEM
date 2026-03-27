/**
 Componente: TipBox
 
 Descripción:
 Este componente renderiza una caja de consejos/información útil para el usuario.
 Se muestra al final de la página del mapa de oficinas para proporcionar ayuda
 contextual sobre las funcionalidades disponibles.
 
 Funcionalidades:
 - Mostrar un mensaje de consejo con un diseño visual atracti
 - Diseño visual distintivo para llamar la atención del usuario
 - Mensaje sobre las acciones de arrastrar, redimensionar y rotar elementos
 
 Contenido del mensaje:
 - Instrucción para arrastrar escritorios u objetos desde el sidebar al mapa
 - Información sobre la capacidad de redimensionar y rotar elementos directamente en el canvas
 
 Props: Este componente no recibe props (es estático)
 
 Dependencias:
 - lucide-react: Icono Info
 */

import { Info } from 'lucide-react'; 

/**
 Componente funcional que renderiza la caja de consejos
 Muestra información de ayuda al usuario sobre las funcionalidades del mapa
 
 @returns JSX.Element - Componente con el consejo/información
 */
export default function TipBox() {
  return (
    // Contenedor principal: fondo azul claro, borde azul, padding y layout flex
    <div className="bg-accent border border-accent text-accent-foreground rounded-lg p-4 flex gap-4 items-center">
      {/* Contenedor del icono: círculo azul con icono blanco/azul */}
      <div className="bg-accent/50 p-2 rounded-full">
        <Info className="w-5 h-5 text-accent-foreground" />
      </div>
      
      {/* Contenido de texto del consejo */}
      <div className="text-xs">
        {/* Título del consejo */}
        <p className="font-bold mb-1">Tip 💡</p>
        {/* Descripción de las funcionalidades */}
        <p>
          Drag desks or objects from the sidebar to the map.
          You can resize and rotate items directly on the canvas.
        </p>
      </div>
    </div>
  );
}

