# Frontend Dependencies Documentation

## Instalaciones del Frontend

Este documento detalla las dependencias instaladas en el frontend del proyecto (ubicado en \`SUPPORTS-SYSTEM/Frontend/package.json\`). Se incluyen las **dependencias principales** (para runtime) con:

- **Propósito**: Función principal en el proyecto.
- **Dónde se utiliza**: Archivos clave donde aparecen imports o uso directo (basado en análisis de código).
- **Notas**: Detalles adicionales.

### Dependencias Principales

#### react (^19.2.0) y react-dom (^19.2.0)
- **Propósito**: Librería core para construir interfaces de usuario reactivas y componentes.
- **Dónde se utiliza**: Todos los archivos \`.tsx\` (ej. \`src/main.tsx\`, \`src/App.tsx\`, contextos como \`AuthContext.tsx\`, componentes UI como \`button.tsx\`, \`dialog.tsx\`, páginas como \`Login.tsx\`, dashboards).
- **Notas**: Base de toda la aplicación Vite + React.

#### react-router-dom (^7.13.1) y react-router
- **Propósito**: Enrutamiento y navegación entre páginas.
- **Dónde se utiliza**: Páginas (\`Login.tsx\`, \`Register.tsx\`, \`EmployeeDashboard.tsx\`, \`AdminDashboard.tsx\`, \`OfficeMap.tsx\`), componentes (\`NotificationsButton.tsx\`, \`OfficeMapHeader.tsx\` con \`useNavigate\`).
- **Notas**: Gestiona rutas protegidas y navegación.

#### lucide-react (^0.575.0)
- **Propósito**: Iconos SVG reactivos para UI.
- **Dónde se utiliza**: Casi todos los componentes y páginas (ej. \`DownloadButtons.tsx\` (CheckSquare), \`KanbanBoard.tsx\` (BarChart3), \`TicketCard.tsx\` (Clock, User), \`Login.tsx\` (Lock, Mail), \`MapLegend.tsx\`).
- **Notas**: Usado extensivamente para iconografía.

#### sonner (^2.0.7)
- **Propósito**: Notificaciones/toasts en la UI.
- **Dónde se utiliza**: \`App.tsx\` (Toaster), \`TicketContext.tsx\`, \`DownloadButtons.tsx\`, \`NotificationsButton.tsx\`, \`MapLegend.tsx\`, \`TicketDetailsModal.tsx\`, \`TicketForm.tsx\`, \`OfficeMap.tsx\`, \`Login.tsx\`, \`Register.tsx\`.
- **Notas**: Sistema global de notificaciones.

#### recharts (^2.15.3)
- **Propósito**: Gráficos y visualizaciones de datos (barras, pie charts).
- **Dónde se utiliza**: \`ReportsPanel.tsx\` (BarChart, PieChart).
- **Notas**: Reportes y dashboards administrativos.

#### react-dnd (^16.0.1) y react-dnd-html5-backend (^16.0.1)
- **Propósito**: Drag & Drop funcionalidad.
- **Dónde se utiliza**: \`KanbanBoard.tsx\` (DndProvider, useDrop, useDrag), \`TicketCard.tsx\` (useDrag).
- **Notas**: Para tablero Kanban de tickets.

#### exceljs (^4.4.0) y xlsx (^0.18.5)
- **Propósito**: Generación y manipulación de archivos Excel/CSV.
- **Dónde se utiliza**: \`exportExcel.ts\` (ExcelJS), posiblemente \`csvParser.ts\`, \`DownloadButtons.tsx\`.
- **Notas**: Exportación de datos/reports.

#### jspdf (^4.2.0) y jspdf-autotable (^5.0.7)
- **Propósito**: Generación de PDFs con tablas.
- **Dónde se utiliza**: \`exportPDF.ts\` (jsPDF, autoTable), \`DownloadButtons.tsx\`.
- **Notas**: Exportación de reports a PDF.

#### @react-three/fiber (^9.5.0) y three (^0.183.1)
- **Propósito**: Renderizado 3D/WebGL en React (mapas interactivos).
- **Dónde se utiliza**: \`MapCanvas.tsx\` y componentes OfficeMap (ogl también relacionado).
- **Notas**: Mapa de oficinas interactivo.

#### class-variance-authority (^0.7.1), tailwind-merge (3.2.0)
- **Propósito**: Gestión de variantes CSS con Tailwind (cn utility).
- **Dónde se utiliza**: Componentes UI (\`alert.tsx\`, \`badge.tsx\`, \`button.tsx\` con cva).
- **Notas**: Estilos consistentes con Tailwind.

#### Componentes Radix UI (@radix-ui/react-dialog, @radix-ui/react-select, etc.)
- **Propósito**: Primitivos UI accesibles (dialogs, selects, slots).
- **Dónde se utiliza**: \`dialog.tsx\`, \`select.tsx\`, \`separator.tsx\`, \`badge.tsx\` (Slot).
- **Notas**: Base headless para UI components.

#### socket.io-client (^4.8.3)
- **Propósito**: Conexiones en tiempo real (notificaciones?).
- **Dónde se utiliza**: No detectado en imports directos visibles; probable en contextos o api.ts.
- **Notas**: Para updates live (tickets/notificaciones).

#### @floating-ui/dom (^1.7.5)
- **Propósito**: Posicionamiento flotante (tooltips/popovers).
- **Dónde se utiliza**: Probable en UI components avanzados (no directo en searches).
- **Notas**: Mejora UX en overlays.

## Dependencias de Desarrollo (DevDependencies)
- Incluyen Vite (^8.0.0-beta.13), TailwindCSS (^4.2.1), ESLint, TypeScript.
- **Propósito**: Build, linting, estilos.
- **Dónde**: Configs (\`vite.config.ts\`, \`eslint.config.js\`, \`tailwindcss\`).

## Instalación
\`\`\`bash
cd SUPPORTS-SYSTEM/Frontend
npm install
\`\`\`

Este análisis se basa en \`package.json\` y búsquedas en código fuente. Para uso específico, revisar imports individuales.

