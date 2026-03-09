/**
 * Componente: StatsCards
 * 
 * Descripción:
 * Este componente muestra las estadísticas principales del mapa de oficinas en forma
 * de tres tarjetas visuales. Cada tarjeta presenta un indicador diferente:
 * - Total de escritorios
 * - Escritorios con reportes activos
 * - Escritorios sin problemas
 * 
 * Funcionalidades:
 * - Visualización de 3 métricas clave en tarjetas separadas
 * - Diseño responsive (1 columna en móvil, 3 columnas en escritorio)
 * - Colores diferenciados para cada tipo de estadística
 * - Uso de componentes Card de la librería UI
 * 
 * Props:
 * - totalDesks: Número total de escritorios en la oficina
 * - reports: Número de escritorios con reportes activos (se muestra en rojo)
 * - noIssues: Número de escritorios sin problemas (se muestra en verde)
 * 
 * Dependencias:
 * - ../ui/card: Componentes Card, CardHeader, CardContent, CardTitle
 */

import { Card, CardHeader, CardContent, CardTitle } from '../ui/card';

/**
 * Interfaz de props para el componente StatsCards
 * Define los parámetros requeridos para renderizar las estadísticas
 */
interface StatsCardsProps {
  /** Número total de escritorios registrados en el sistema */
  totalDesks: number;
  /** Número de escritorios que tienen reportes/informes activos */
  reports: number;
  /** Número de escritorios que no tienen ningún problema reportado */
  noIssues: number;
}

/**
 * Componente funcional que renderiza las tarjetas de estadísticas
 * Muestra 3 métricas importantes del mapa de oficinas:
 * 1. Total de escritorios (color gris/negro)
 * 2. Escritorios con reportes activos (color rojo)
 * 3. Escritorios sin problemas (color verde)
 * 
 * @param props - Propiedades del componente conteniendo los conteos estadísticos
 * @returns JSX.Element - Grid de 3 tarjetas con estadísticas
 */
export default function StatsCards({ totalDesks, reports, noIssues }: StatsCardsProps) {
  return (
    // Contenedor grid: 1 columna en móvil, 3 columnas en pantallas medianas+
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      {/* Tarjeta 1: Total de escritorios */}
      <Card>
        {/* Encabezado de la tarjeta con título */}
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-gray-600">
            Total Desks
          </CardTitle>
        </CardHeader>
        {/* Contenido con el número grande en color gris oscuro */}
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{totalDesks}</div>
        </CardContent>
      </Card>

      {/* Tarjeta 2: Escritorios con reportes activos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-gray-600">
            With Active Reports
          </CardTitle>
        </CardHeader>
        {/* Contenido con el número en rojo para indicar alerta/problema */}
        <CardContent>
          <div className="text-3xl font-bold text-red-600">{reports}</div>
        </CardContent>
      </Card>

      {/* Tarjeta 3: Escritorios sin problemas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-gray-600">
            No Issues
          </CardTitle>
        </CardHeader>
        {/* Contenido con el número en verde para indicar estado correcto */}
        <CardContent>
          <div className="text-3xl font-bold text-green-600">{noIssues}</div>
        </CardContent>
      </Card>
    </div>
  );
}

