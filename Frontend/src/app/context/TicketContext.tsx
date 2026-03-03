import { createContext, useContext, useState, ReactNode } from 'react';
import { Ticket, Comment } from '../types/ticket';

interface TicketContextType {
  tickets: Ticket[];
  addTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  addComment: (ticketId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  deleteTicket: (id: string) => void;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export function TicketProvider({ children }: { children: ReactNode }) {
  // Inicializamos el estado como un arreglo vacío []
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const addTicket = (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => {
    const newTicket: Ticket = {
      ...ticket,
      id: `ticket-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: [],
    };
    setTickets((prev) => [newTicket, ...prev]);
  };

  const updateTicket = (id: string, updates: Partial<Ticket>) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === id
          ? { ...ticket, ...updates, updatedAt: new Date() }
          : ticket
      )
    );
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