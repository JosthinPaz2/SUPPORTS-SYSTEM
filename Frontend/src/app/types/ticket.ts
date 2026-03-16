export type UserRole = 'admin' | 'employee';
// Rol de un usuario: administrador o empleado

export type TicketStatus = 'pending' | 'in-progress' | 'resolved';
// Estado del ticket: pendiente, en progreso o resuelto

export type TicketPriority = 'low' | 'medium' | 'high';
// Prioridad del ticket: baja, media o alta

export type TicketCategory = 'hardware' | 'software' | 'other';
// Categoría del ticket: hardware, software u otra

/* ==========================================
  Usuario
========================================== */
export interface User {
  id: string;          // Identificador único del usuario
  name: string;        // Nombre completo del usuario
  email: string;       // Correo institucional o de contacto
  role: UserRole;      // Rol del usuario
}

/* ==========================================
  Comentario en un ticket
========================================== */
export interface Comment {
  id: string;          // ID único del comentario
  ticketId: string;    // ID del ticket asociado
  userId: string;      // ID del usuario que hizo el comentario
  userName: string;    // Nombre del usuario (para mostrar en UI)
  content: string;     // Contenido del comentario
  isInternal: boolean; // Indica si es comentario interno (solo visible a personal técnico)
  createdAt: Date;     // Fecha de creación del comentario
}

/* ==========================================
  Ticket
========================================== */
export interface Ticket {
  id: string;                     // ID único del ticket
  title: string;                  // Título breve del ticket
  description?: string;           // Descripción detallada (opcional)
  category: TicketCategory;       // Categoría del ticket
  status: TicketStatus;           // Estado actual del ticket
  priority: TicketPriority;       // Prioridad del ticket
  createdBy: string;              // ID del usuario que lo creó
  createdByName: string;          // Nombre del usuario creador
  reportedBy: string;             // Nombre o ID del reportante (puede coincidir con creador)
  location?: string;              // Ubicación asociada al ticket (opcional)
  assignedTo?: string;            // ID del técnico principal asignado
  assignedToName?: string;        // Nombre del técnico principal
  secondaryTechnicianId?: string; // ID del técnico secundario (opcional)
  secondaryTechnicianName?: string; // Nombre del técnico secundario (opcional)
  createdAt: Date;                // Fecha de creación del ticket
  updatedAt: Date;                // Fecha de última actualización
  comments: Comment[];            // Lista de comentarios asociados
  movedBy?: string;               // ID del usuario que movió el ticket (opcional)
  movedByName?: string;           // Nombre del usuario que movió el ticket
  categoryDetail?: string;        // Detalle adicional de la categoría (opcional)
}