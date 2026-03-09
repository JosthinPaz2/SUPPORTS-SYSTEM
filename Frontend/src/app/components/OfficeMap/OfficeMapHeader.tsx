/**
 * Componente: OfficeMapHeader
 * 
 * Descripción:
 * Este componente representa el encabezado de la página del mapa de oficinas.
 * Muestra el título de la página, un subtítulo descriptivo y un botón para
 * regresar al dashboard anterior.
 * 
 * Funcionalidades:
 * - Visualización del título principal de la página
 * - Subtítulo informativo sobre el propósito de la página
 * - Botón de navegación para regresar a la página anterior usando useNavigate
 * 
 * Props:
 * - title (opcional): Título principal a mostrar. Por defecto: "Office Map - Desk Layout"
 * - subtitle (opcional): Subtítulo descriptivo. Por defecto: "Overview of all desks and active reports"
 * 
 * Dependencias:
 * - react-router: useNavigate para la navegación
 * - lucide-react: Iconos (ArrowLeft)
 * - ../ui/button: Componente Button reutilizable
 */

import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

/**
 * Interfaz de props para el componente OfficeMapHeader
 * Define los parámetros opcionales que puede recibir el componente
 */
interface OfficeMapHeaderProps {
  /** Título principal de la página */
  title?: string;
  /** Subtítulo descriptivo que aparece debajo del título */
  subtitle?: string;
}

/**
 * Componente funcional que renderiza el encabezado del mapa de oficinas
 * @param props - Propiedades del componente (title, subtitle)
 * @returns JSX.Element - Elemento React con la estructura del encabezado
 */
export default function OfficeMapHeader({ 
  title = "Office Map - Desk Layout", 
  subtitle = "Overview of all desks and active reports" 
}: OfficeMapHeaderProps) {
  // Hook de React Router para navegar hacia atrás en el historial
  const navigate = useNavigate();

  return (
    // Contenedor principal con estilos de Tailwind: flexbox, padding, fondo blanco, borde y sombra
    <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
      {/* Sección izquierda: Título y subtítulo */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      
      {/* Botón para regresar al dashboard anterior */}
      <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Button>
    </div>
  );
}

