import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrop } from 'react-dnd';
import { useTickets } from '../context/TicketContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Ticket, TicketStatus, TicketCategory, TicketPriority } from '../types/ticket'; 
import TicketCard from './TicketCard';
import TicketDetailsModal from './TicketDetailsModal';
import { Filter, BarChart3, ChevronRight } from 'lucide-react';

interface DropZoneProps {
  status: TicketStatus;
  tickets: Ticket[];
  totalCount?: number;
  onDrop: (ticketId: string, newStatus: TicketStatus) => void;
  onTicketClick: (ticket: Ticket) => void;
  allowDrop: boolean;
}

function DropZone({ status, tickets, totalCount, onDrop, onTicketClick, allowDrop }: DropZoneProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TICKET',
    drop: allowDrop ? (item: { id: string }) => onDrop(item.id, status) : undefined,
    collect: (monitor) => ({
      isOver: allowDrop ? monitor.isOver() : false,
    }),
  }));

  const statusConfig = {
    pending: { title: 'Pending', color: 'bg-yellow-100 border-yellow-300', badge: 'bg-yellow-500' },
    'in-progress': { title: 'In Progress', color: 'bg-blue-100 border-blue-300', badge: 'bg-blue-500' },
    resolved: { title: 'Resolved', color: 'bg-green-100 border-green-300', badge: 'bg-green-500' },
  };

  const config = statusConfig[status];

  return (
    <div
      ref={(node) => { drop(node); }}
      className={`flex-1 min-h-[500px] transition-colors ${isOver ? 'bg-blue-50/50' : ''}`}
    >
      <Card className={`h-full border-t-4 ${config.color}`}>
        <CardHeader className="pb-3 text-center md:text-left">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>{config.title}</span>
            <Badge className={`${config.badge} text-white`}>
              {totalCount ?? tickets.length}
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
          {status === 'resolved' && totalCount !== undefined && totalCount > tickets.length && (
            <p className="text-center text-xs text-gray-400 italic pt-1">
              Showing {tickets.length} of {totalCount} resolved — older tickets in Change History
            </p>
          )}
          {tickets.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm italic">
              No tickets in this status
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
  const isIT = user?.id_role === 1;

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');

  const handleCategoryChange = (value: string) => {
    const nextCategory = value as TicketCategory | 'all';
    setCategoryFilter(nextCategory);
    if (nextCategory === 'all') {
      setPriorityFilter('all');
    }
  };

  const handleDrop = (ticketId: string, newStatus: TicketStatus) => {
    if (isIT) {
      updateTicket(ticketId, {
        status: newStatus,
        movedBy: String(user?.id ?? ''),
        movedByName: user?.name ?? undefined,
      });
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const categoryMatch = categoryFilter === 'all' || t.category === categoryFilter;
    const priorityMatch = priorityFilter === 'all' || t.priority === priorityFilter;
    return categoryMatch && priorityMatch;
  });

  const allResolved = filteredTickets.filter((t) => t.status === 'resolved');
  const ticketsByStatus = {
    pending: filteredTickets.filter((t) => t.status === 'pending'),
    'in-progress': filteredTickets.filter((t) => t.status === 'in-progress'),
    resolved: [...allResolved]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3),
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Sección de Filtros Progresiva */}
        {isIT && (
          <Card className="border-none shadow-sm bg-slate-50">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-4 md:gap-8">
                
                {/* Filtro por Categoría */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-semibold">Category:</span>
                  </div>
                  <Select
                    value={categoryFilter}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger className="w-40 bg-white shadow-sm">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Prioridad */}
                {categoryFilter !== 'all' && (
                  <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                    <ChevronRight className="text-gray-300 hidden md:block" />
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-sm font-semibold">Priority:</span>
                      </div>
                      <Select
                        value={priorityFilter}
                        onValueChange={(value) => setPriorityFilter(value as TicketPriority | 'all')}
                      >
                        <SelectTrigger className="w-40 bg-white border-blue-200 shadow-sm focus:ring-blue-500">
                          <SelectValue placeholder="Filter Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All priorities</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

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
            totalCount={allResolved.length}
            onDrop={handleDrop}
            onTicketClick={setSelectedTicket}
            allowDrop={isIT}
          />
        </div>

        {/* Instrucciones */}
        <Card className="bg-blue-50 border-blue-200 border-dashed">
          <CardContent className="py-3 flex items-center justify-center gap-2">
            <span className="text-lg">💡</span>
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Filters help you focus. Selecting a category reveals priority options.
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