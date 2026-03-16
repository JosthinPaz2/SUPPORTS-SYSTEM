// Importa React para poder crear componentes
import React from 'react';

/*
  Componente Label reutilizable
  Se utiliza para etiquetar inputs o controles de formulario
*/
export function Label({
  htmlFor,      // ID del input al que se asocia el label
  children,     // Contenido del label (texto u otros elementos)
  className = '' // Clases adicionales opcionales
}: {
  htmlFor?: string;          // Prop opcional para vincular el label con un input
  children: React.ReactNode; // Contenido que se mostrará dentro del label
  className?: string;        // Permite añadir clases extra
}) {
  return (
    <label 
      htmlFor={htmlFor} // Conecta el label con el input (mejora accesibilidad)
      className={`block text-sm font-medium ${className}`} // Estilos base + clases extra
      style={{ color: '#374151' }} // Color del texto del label
    >
      {children} {/* Contenido del label */}
    </label>
  );
}