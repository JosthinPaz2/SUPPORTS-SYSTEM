import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Ticket, Comment, TicketCategory, TicketPriority, TicketStatus } from '../types/ticket';
import { apiService } from '../utils/api';
import { toast } from 'sonner';

interface TicketContextType {
  tickets: Ticket[];
  addTicket: (
    ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'comments'> & {
      id?: string;
      createdAt?: Date;
      updatedAt?: Date;
    }
  ) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  addComment: (ticketId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  deleteTicket: (id: string) => void;
  refreshTickets: () => Promise<void>;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

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

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const AUTO_REFRESH_MS = Number(import.meta.env.VITE_TICKETS_REFRESH_MS || 5000);

  const fetchMappedTickets = useCallback(async (): Promise<Ticket[]> => {
    const [ticketRows, categories, users] = await Promise.all([
      apiService.getTickets(),
      apiService.getCategories(),
      apiService.getUsers(),
    ]);

    const categoryById = new Map(
      categories.map((category) => [category.id_category, category.category_name]),
    );

    const usersById = new Map(
      users.map((user) => [String(user.id_user), user.full_name]),
    );

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
          ? (usersById.get(String(ticket.primary_technician)) || `User ${ticket.primary_technician}`)
          : undefined,
      secondaryTechnicianId:
        ticket.secondary_technician != null ? String(ticket.secondary_technician) : undefined,
      secondaryTechnicianName:
        ticket.secondary_technician != null
          ? (usersById.get(String(ticket.secondary_technician)) || `User ${ticket.secondary_technician}`)
          : undefined,
      movedBy: ticket.moved_by != null ? String(ticket.moved_by) : undefined,
      movedByName:
        ticket.moved_by != null
          ? (usersById.get(String(ticket.moved_by)) || `User ${ticket.moved_by}`)
          : undefined,
      createdAt: new Date(ticket.created_at),
      updatedAt: new Date(ticket.created_at),
      comments: [],
    }));
  }, []);

  const refreshTickets = useCallback(async () => {
    const mapped = await fetchMappedTickets();
    setTickets(mapped);
  }, [fetchMappedTickets]);

  useEffect(() => {
    let cancelled = false;

    const loadTickets = async (showErrorToast = true) => {
      try {
        const mappedTickets = await fetchMappedTickets();
        if (!cancelled) {
          setTickets(mappedTickets);
        }
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

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    let previousTicket: Ticket | undefined;

    setTickets((prev) =>
      prev.map((ticket) => {
        if (ticket.id !== id) {
          return ticket;
        }

        previousTicket = ticket;
        return { ...ticket, ...updates, updatedAt: new Date() };
      })
    );

    const numericTicketId = Number(id);
    if (!Number.isFinite(numericTicketId)) {
      return;
    }

    if (!updates.status) {
      return;
    }

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
      // Compatibility fallback: if backend is not migrated yet for moved_by,
      // retry status update without moved_by so board movement still persists.
      if (updates.movedBy) {
        try {
          await apiService.updateTicket(numericTicketId, basePayload);
          await refreshTickets();
          toast.warning('Status updated, but the user who moved the ticket could not be saved.');
          return;
        } catch {
          // Continue to rollback below if fallback also fails.
        }
      }

      if (previousTicket) {
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === id ? previousTicket as Ticket : ticket
          )
        );
      }

      toast.error((error as Error).message || 'Could not update the ticket status');
    }
  };

  const addComment = (ticketId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => {
    const newComment: Comment = {
      ...comment,
      id: `comment-${Date.now()}`,
      createdAt: new Date(),
    };

    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              comments: [...ticket.comments, newComment],
              updatedAt: new Date(),
            }
          : ticket
      )
    );
  };

  const deleteTicket = (id: string) => {
    setTickets((prev) => prev.filter((ticket) => ticket.id !== id));
  };

  return (
    <TicketContext.Provider
      value={{ tickets, addTicket, updateTicket, addComment, deleteTicket, refreshTickets }}
    >
      {children}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
}