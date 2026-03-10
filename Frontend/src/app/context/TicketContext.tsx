import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export function TicketProvider({ children }: { children: ReactNode }) {
  // Inicializamos el estado como un arreglo vacío []
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
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

    const loadTickets = async () => {
      try {
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

        const mappedTickets: Ticket[] = ticketRows.map((ticket) => ({
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
          createdAt: new Date(ticket.created_at),
          updatedAt: new Date(ticket.created_at),
          comments: [],
        }));

        setTickets(mappedTickets);
      } catch (error) {
        toast.error((error as Error).message || 'Could not load tickets');
      }
    };

    loadTickets();
  }, []);

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
    } catch (error) {
      // Compatibility fallback: if backend is not migrated yet for moved_by,
      // retry status update without moved_by so board movement still persists.
      if (updates.movedBy) {
        try {
          await apiService.updateTicket(numericTicketId, basePayload);
          toast.warning('Estado actualizado, pero no se pudo guardar quién movió el ticket.');
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
      value={{ tickets, addTicket, updateTicket, addComment, deleteTicket }}
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