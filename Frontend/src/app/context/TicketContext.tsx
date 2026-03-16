import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Ticket, Comment, TicketCategory, TicketPriority, TicketStatus } from '../types/ticket';
import { apiService } from '../utils/api';
import { toast } from 'sonner';

/* ==========================================
  Tipo del contexto de tickets
========================================== */
interface TicketContextType {
  tickets: Ticket[]; // Lista de tickets cargados
  addTicket: (
    ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'comments'> & {
      id?: string;
      createdAt?: Date;
      updatedAt?: Date;
    }
  ) => void; // Agregar ticket localmente
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>; // Actualizar ticket
  addComment: (ticketId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void; // Agregar comentario
  deleteTicket: (id: string) => void; // Eliminar ticket
  refreshTickets: () => Promise<void>; // Refrescar lista de tickets desde API
}

/* ==========================================
  Crear contexto
========================================== */
const TicketContext = createContext<TicketContextType | undefined>(undefined);

/* ==========================================
  Funciones de normalización de datos
========================================== */
const normalizeCategory = (categoryName: string): TicketCategory => {
  const normalized = categoryName.trim().toLowerCase();
  if (normalized === 'hardware') return 'hardware';
  if (normalized === 'software') return 'software';
  return 'other';
};

const normalizeStatus = (status: string): TicketStatus => {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'in progress' || normalized === 'in-progress') return 'in-progress';
  if (normalized === 'resolved') return 'resolved';
  return 'pending';
};

const normalizePriority = (priority: string): TicketPriority => {
  const normalized = priority.trim().toLowerCase();
  if (normalized === 'medium') return 'medium';
  if (normalized === 'high' || normalized === 'urgent') return 'high';
  return 'low';
};

/* ==========================================
  Provider de tickets
  - Maneja estado, CRUD y sincronización con API
========================================== */
export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Intervalo automático para refrescar tickets
  const AUTO_REFRESH_MS = Number(import.meta.env.VITE_TICKETS_REFRESH_MS || 5000);

  /* ------------------------------------------
    Función para obtener tickets y mapear datos
    - Convierte IDs a nombres legibles
    - Normaliza categorías, estado y prioridad
  ------------------------------------------ */
  const fetchMappedTickets = useCallback(async (): Promise<Ticket[]> => {
    const [ticketRows, categories, users] = await Promise.all([
      apiService.getTickets(),
      apiService.getCategories(),
      apiService.getUsers(),
    ]);

    const categoryById = new Map(categories.map((c) => [c.id_category, c.category_name]));
    const usersById = new Map(users.map((u) => [String(u.id_user), u.full_name]));

    return ticketRows.map((ticket) => ({
      id: String(ticket.id_ticket),
      title: ticket.title,
      description: ticket.description,
      category: normalizeCategory(categoryById.get(ticket.id_category) || 'other'),
      status: normalizeStatus(ticket.status),
      priority: normalizePriority(ticket.priority),
      createdBy: String(ticket.created_by),
      createdByName: usersById.get(String(ticket.created_by)) || `User ${ticket.created_by}`,
      reportedBy: usersById.get(String(ticket.created_by)) || `User ${ticket.created_by}`,
      location: ticket.id_station || undefined,
      assignedTo: ticket.primary_technician != null ? String(ticket.primary_technician) : undefined,
      assignedToName:
        ticket.primary_technician != null
          ? usersById.get(String(ticket.primary_technician)) || `User ${ticket.primary_technician}`
          : undefined,
      secondaryTechnicianId:
        ticket.secondary_technician != null ? String(ticket.secondary_technician) : undefined,
      secondaryTechnicianName:
        ticket.secondary_technician != null
          ? usersById.get(String(ticket.secondary_technician)) || `User ${ticket.secondary_technician}`
          : undefined,
      movedBy: ticket.moved_by != null ? String(ticket.moved_by) : undefined,
      movedByName:
        ticket.moved_by != null
          ? usersById.get(String(ticket.moved_by)) || `User ${ticket.moved_by}`
          : undefined,
      createdAt: new Date(ticket.created_at),
      updatedAt: new Date(ticket.created_at),
      comments: [],
    }));
  }, []);

  // Refrescar tickets y actualizar estado
  const refreshTickets = useCallback(async () => {
    const mapped = await fetchMappedTickets();
    setTickets(mapped);
  }, [fetchMappedTickets]);

  /* ------------------------------------------
    useEffect: cargar tickets al inicio y refresco automático
  ------------------------------------------ */
  useEffect(() => {
    let cancelled = false;

    const loadTickets = async (showErrorToast = true) => {
      try {
        const mappedTickets = await fetchMappedTickets();
        if (!cancelled) setTickets(mappedTickets);
      } catch (error) {
        if (showErrorToast && !cancelled) {
          toast.error((error as Error).message || 'Could not load tickets');
        }
      }
    };

    loadTickets();
    const intervalId = window.setInterval(() => {
      loadTickets(false);
    }, AUTO_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [AUTO_REFRESH_MS, fetchMappedTickets]);

  /* ------------------------------------------
    Agregar un ticket localmente
  ------------------------------------------ */
  const addTicket = (
    ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'comments'> & {
      id?: string;
      createdAt?: Date;
      updatedAt?: Date;
    }
  ) => {
    const newTicket: Ticket = {
      ...ticket,
      id: ticket.id ?? `ticket-${Date.now()}`,
      createdAt: ticket.createdAt ?? new Date(),
      updatedAt: ticket.updatedAt ?? new Date(),
      comments: [],
    };
    setTickets((prev) => [newTicket, ...prev]);
  };

  /* ------------------------------------------
    Actualizar ticket
    - Optimista en UI
    - Sincroniza con API
    - Maneja fallback en caso de error
  ------------------------------------------ */
  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    let previousTicket: Ticket | undefined;

    setTickets((prev) =>
      prev.map((ticket) => {
        if (ticket.id !== id) return ticket;
        previousTicket = ticket;
        return { ...ticket, ...updates, updatedAt: new Date() };
      })
    );

    const numericTicketId = Number(id);
    if (!Number.isFinite(numericTicketId)) return;
    if (!updates.status) return;

    const statusMap: Record<string, string> = {
      pending: 'Pending',
      'in-progress': 'In Progress',
      resolved: 'Resolved',
    };

    const basePayload = {
      status: statusMap[updates.status] ?? updates.status,
      resolved_at: updates.status === 'resolved' ? new Date().toISOString() : undefined,
    };

    try {
      await apiService.updateTicket(numericTicketId, {
        ...basePayload,
        moved_by: updates.movedBy ? Number(updates.movedBy) : undefined,
      });
      await refreshTickets();
    } catch (error) {
      // Fallback: si moved_by falla, actualizar solo status
      if (updates.movedBy) {
        try {
          await apiService.updateTicket(numericTicketId, basePayload);
          await refreshTickets();
          toast.warning('Status updated, but the user who moved the ticket could not be saved.');
          return;
        } catch {
          // rollback más abajo si falla
        }
      }

      // Rollback a ticket anterior
      if (previousTicket) {
        setTickets((prev) =>
          prev.map((ticket) => (ticket.id === id ? previousTicket as Ticket : ticket))
        );
      }

      toast.error((error as Error).message || 'Could not update the ticket status');
    }
  };

  /* ------------------------------------------
    Agregar comentario a un ticket
  ------------------------------------------ */
  const addComment = (ticketId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => {
    const newComment: Comment = { ...comment, id: `comment-${Date.now()}`, createdAt: new Date() };

    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, comments: [...ticket.comments, newComment], updatedAt: new Date() }
          : ticket
      )
    );
  };

  /* ------------------------------------------
    Eliminar ticket localmente
  ------------------------------------------ */
  const deleteTicket = (id: string) => {
    setTickets((prev) => prev.filter((ticket) => ticket.id !== id));
  };

  /* ------------------------------------------
    Proveer contexto
  ------------------------------------------ */
  return (
    <TicketContext.Provider
      value={{ tickets, addTicket, updateTicket, addComment, deleteTicket, refreshTickets }}
    >
      {children}
    </TicketContext.Provider>
  );
}

/* ==========================================
  Hook para usar tickets
  - Falla si no está dentro del Provider
========================================== */
export function useTickets() {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
}