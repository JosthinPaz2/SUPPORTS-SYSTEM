export type UserRole = 'admin' | 'employee';

export type TicketStatus = 'pending' | 'in-progress' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketCategory = 'hardware' | 'software' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
}

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: string;
  createdByName: string;
  reportedBy: string;
  location?: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: Date;
  updatedAt: Date;
  comments: Comment[];
}
