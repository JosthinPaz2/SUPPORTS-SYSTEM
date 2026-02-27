import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrop } from 'react-dnd';
import { useTickets } from '../context/TicketContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Ticket, TicketStatus, TicketCategory } from '../types/ticket';
import TicketCard from './TicketCard';
import TicketDetailsModal from './TicketDetailsModal';
import { Filter } from 'lucide-react';

interface DropZoneProps {
  status: TicketStatus;
  tickets: Ticket[];
  onDrop: (ticketId: string, newStatus: TicketStatus) => void;
  onTicketClick: (ticket: Ticket) => void;
  allowDrop: boolean;
}

function DropZone({ status, tickets, onDrop, onTicketClick, allowDrop }: DropZoneProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TICKET',
    drop: allowDrop ? (item: { id: string }) => onDrop(item.id, status) : undefined,
    collect: (monitor) => ({
      isOver: allowDrop ? monitor.isOver() : false,
    }),
  }));

  const statusConfig = {
    pending: {
      title: 'Pending',
      color: 'bg-yellow-100 border-yellow-300',
      badge: 'bg-yellow-500',
    },
    'in-progress': {
      title: 'In Progress',
      color: 'bg-blue-100 border-blue-300',
      badge: 'bg-blue-500',
    },
    resolved: {
      title: 'Resolved',
      color: 'bg-green-100 border-green-300',
      badge: 'bg-green-500',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      ref={drop}
      className={`flex-1 min-h-[600px] transition-colors ${
        isOver ? 'bg-blue-50' : ''
      }`}
    >
      <Card className={`h-full ${config.color}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>{config.title}</span>
            <Badge className={config.badge + ' text-white'}>
              {tickets.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => onTicketClick(ticket)}
            />
          ))}
          {tickets.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No tickets
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function KanbanBoard() {
  const { tickets, updateTicket } = useTickets();
  const { user } = useAuth();
  const role = user?.role ?? '';
  const isIT = role.toLowerCase() === 'it';

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all');

  const handleDrop = (ticketId: string, newStatus: TicketStatus) => {
    if (isIT) {
      updateTicket(ticketId, { status: newStatus });
    }
  };

  // Filtrar tickets por categoría
  const filteredTickets =
    categoryFilter === 'all'
      ? tickets
      : tickets.filter((t) => t.category === categoryFilter);

  // Agrupar por estado
  const ticketsByStatus = {
    pending: filteredTickets.filter((t) => t.status === 'pending'),
    'in-progress': filteredTickets.filter((t) => t.status === 'in-progress'),
    resolved: filteredTickets.filter((t) => t.status === 'resolved'),
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Filters */}
        {isIT && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Filter by category:</span>
                </div>
                <Select
                  value={categoryFilter}
                  onValueChange={(value) => setCategoryFilter(value as TicketCategory | 'all')}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-sm text-gray-600">
                  Total: {filteredTickets.length} tickets
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DropZone
            status="pending"
            tickets={ticketsByStatus.pending}
            onDrop={handleDrop}
            onTicketClick={setSelectedTicket}
            allowDrop={isIT}
          />
          <DropZone
            status="in-progress"
            tickets={ticketsByStatus['in-progress']}
            onDrop={handleDrop}
            onTicketClick={setSelectedTicket}
            allowDrop={isIT}
          />
          <DropZone
            status="resolved"
            tickets={ticketsByStatus.resolved}
            onDrop={handleDrop}
            onTicketClick={setSelectedTicket}
            allowDrop={isIT}
          />
        </div>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Drag and drop cards between columns to change their status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Details modal */}
      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          isAdmin={isIT}
        />
      )}
    </DndProvider>
  );
}
