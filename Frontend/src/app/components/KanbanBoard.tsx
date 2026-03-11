import { useState, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrop } from 'react-dnd';
import { useTickets } from '../context/TicketContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Ticket, TicketStatus, TicketCategory, TicketPriority } from '../types/ticket'; 
import TicketCard from './TicketCard';
import TicketDetailsModal from './TicketDetailsModal';
import { BarChart3, Search, Calendar, User, XCircle, ShieldCheck, ChevronDown } from 'lucide-react';

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
  }), [allowDrop, status, onDrop]);

  const statusConfig = {
    pending: { title: 'Pending', color: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-500' },
    'in-progress': { title: 'In Progress', color: 'bg-blue-50 border-blue-200', badge: 'bg-blue-500' },
    resolved: { title: 'Resolved', color: 'bg-green-50 border-green-200', badge: 'bg-green-500' },
  };

  const config = statusConfig[status];

  return (
    <div
      ref={(node) => { drop(node); }}
      className={`flex-1 min-h-[500px] transition-all duration-200 rounded-lg ${isOver ? 'bg-slate-200/50 scale-[1.01]' : ''}`}
    >
      <Card className={`h-full border-t-4 ${config.color} shadow-sm`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>{config.title}</span>
            <Badge className={`${config.badge} text-white font-bold`}>
              {totalCount ?? tickets.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={() => onTicketClick(ticket)} />
          ))}
          {tickets.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm italic border-2 border-dashed border-gray-100 rounded-lg">
              No tickets found
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
  const [isHovered, setIsHovered] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [dateFilter, setDateFilter] = useState('');

  // Lógica para mantener abierto el panel si hay filtros activos
  const hasFiltersActive = searchTerm !== '' || categoryFilter !== 'all' || priorityFilter !== 'all' || dateFilter !== '';
  const isExpanded = isHovered || hasFiltersActive;

  const handleDrop = (ticketId: string, newStatus: TicketStatus) => {
    if (isIT) {
      updateTicket(ticketId, {
        status: newStatus,
        movedBy: String(user?.id ?? ''),
        movedByName: user?.name ?? undefined,
      });
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      
      const matchesSearch = searchTerm === '' || 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.movedByName && t.movedByName.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesDate = true;
      if (dateFilter) {
        const ticketDate = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
        const ticketDateStr = ticketDate.toISOString().split('T')[0];
        matchesDate = ticketDateStr === dateFilter;
      }

      return matchesCategory && matchesPriority && matchesSearch && matchesDate;
    });
  }, [tickets, categoryFilter, priorityFilter, searchTerm, dateFilter]);

  const ticketsByStatus = {
    pending: filteredTickets.filter((t) => t.status === 'pending'),
    'in-progress': filteredTickets.filter((t) => t.status === 'in-progress'),
    resolved: filteredTickets.filter((t) => t.status === 'resolved')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setDateFilter('');
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        
        {/* Panel de Filtros Desplegable*/}
        {isIT && (
          <Card 
            className="border-none shadow-md bg-white overflow-hidden transition-all duration-300 ease-in-out"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="bg-gray-600 p-2 text-white text-[10px] uppercase tracking-widest text-center font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-gray-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Control Panel
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
            
            {/* CONTENEDOR ANIMADO CORREGIDO */}
            <div 
              className={`transition-all duration-500 ease-in-out overflow-hidden ${
                isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              {/* Padding interno para no romper la animación de la altura del contenedor padre */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-[-25px]">
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Búsqueda */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                      <User className="w-3 h-3 text-blue-500" /> Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="Tech or title..." 
                        className="pl-9 border-slate-200 focus:ring-blue-500 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Fecha */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-500" /> Date
                    </label>
                    <Input 
                      type="date" 
                      className="border-slate-200 focus:ring-blue-500 bg-white"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                  </div>

                  {/* Categoría */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Category</label>
                    <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
                      <SelectTrigger className="border-slate-200 bg-white text-xs">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="hardware">Hardware</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Prioridad */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                      <BarChart3 className="w-3 h-3 text-blue-500" /> Priority
                    </label>
                    <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
                      <SelectTrigger className="border-slate-200 bg-white text-xs">
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                    {hasFiltersActive && (
                    <button 
                      onClick={resetFilters}
                      className="group text-xs flex items-center gap-1.5 text-blue-600 hover:text-red-600 transition-all font-semibold"
                    >
                      <XCircle className="w-4 h-4 text-red-400 group-hover:text-red-600" /> 
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tablero Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
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
            totalCount={filteredTickets.filter(t => t.status === 'resolved').length}
            onDrop={handleDrop}
            onTicketClick={setSelectedTicket}
            allowDrop={isIT}
          />
        </div>
      </div>

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