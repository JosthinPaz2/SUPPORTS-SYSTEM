import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Ticket, TicketStatus, Comment } from '../types/ticket';

interface TicketContextType {
  tickets: Ticket[];
  addTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  addComment: (ticketId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  deleteTicket: (id: string) => void;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

// Dato de ejemplo iniciales
const mockTickets: Ticket[] = [
  {
    id: 'ticket-1',
    title: 'Impresora no funciona',
    description: 'La impresora del piso 3 no imprime documentos',
    category: 'hardware',
    status: 'pending',
    priority: 'high',
    createdBy: 'user-emp1',
    createdByName: 'María García',
    reportedBy: 'María García',
    location: 'D-015',
    createdAt: new Date('2026-02-20T09:00:00'),
    updatedAt: new Date('2026-02-20T09:00:00'),
    comments: [],
  },
];

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);

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