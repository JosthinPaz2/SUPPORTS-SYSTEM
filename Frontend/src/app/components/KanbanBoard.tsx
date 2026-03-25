import { useState, useMemo, useEffect} from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrop } from 'react-dnd';
import { useTickets } from '../context/TicketContext';
import { apiService, LocationOption, FloorOption, StationOption } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Ticket, TicketStatus, TicketCategory, TicketPriority } from '../types/ticket'; 
import TicketCard from './TicketCard';
import TicketDetailsModal from './TicketDetailsModal';
import { BarChart3, Search, Calendar, User, XCircle, ShieldCheck, ChevronDown, MapPin } from 'lucide-react';

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
pending: { title: 'Pending', color: 'bg-amber-500/10 border-amber-500/30', badge: 'bg-amber-500' },
'in-progress': { title: 'In Progress', color: 'bg-blue-500/10 border-blue-500/30', badge: 'bg-blue-500' },
resolved: { title: 'Resolved', color: 'bg-emerald-500/10 border-emerald-500/30', badge: 'bg-emerald-500' },
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
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [stationToLocation, setStationToLocation] = useState<Map<string, string>>(new Map());
  

  const locationOptions = useMemo(() => {
    return locations
      .map((location) => location.location_name.trim())
      .filter((name) => name.length > 0)
      .sort((a, b) => a.localeCompare(b));
  }, [locations]);

useEffect(() => {
    let cancelled = false;

    const loadLocationData = async () => {
      try {
        const [locationRows, floorRows, stationRows] = await Promise.all([
          apiService.getLocations(),
          apiService.getFloors(),
          apiService.getStations(),
        ]);

        if (cancelled) return;

        setLocations(locationRows);

        const locationNameById = new Map<number, string>(
          locationRows.map((location) => [location.id_location, location.location_name])
        );
        const locationIdByFloor = new Map<number, number>(
          floorRows.map((floor: FloorOption) => [floor.id_floor, floor.id_location])
        );

        const stationLocationMap = new Map<string, string>();
        stationRows.forEach((station: StationOption) => {
          const locationId = locationIdByFloor.get(station.id_floor);
          if (!locationId) return;
          const locationName = locationNameById.get(locationId);
          if (!locationName) return;
          stationLocationMap.set(station.id_station, locationName);
        });

        setStationToLocation(stationLocationMap);
      } catch {
        if (cancelled) return;
        setLocations([]);
        setStationToLocation(new Map());
      }
    };

    loadLocationData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Lógica para mantener abierto el panel si hay filtros activos
   const hasFiltersActive = searchTerm !== '' || categoryFilter !== 'all' || priorityFilter !== 'all' || locationFilter !== 'all' || dateFilter !== '';
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
      const ticketLocationName = t.location ? stationToLocation.get(t.location) ?? t.location : '';
      const matchesLocation =
        locationFilter === 'all' ||
        ticketLocationName.trim().toLowerCase() === locationFilter.toLowerCase();
      
      const matchesSearch = searchTerm === '' || 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.movedByName && t.movedByName.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesDate = true;
      if (dateFilter) {
        const ticketDate = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
        const ticketDateStr = ticketDate.toISOString().split('T')[0];
        matchesDate = ticketDateStr === dateFilter;
      }

      return matchesCategory && matchesPriority && matchesLocation && matchesSearch && matchesDate;
    });
  }, [tickets, categoryFilter, priorityFilter, locationFilter, searchTerm, dateFilter, stationToLocation]);


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
    setLocationFilter('all');
    setDateFilter('');
  };

  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        
        {/* Panel de Filtros Desplegable*/}
        {isIT && (
        <Card 
          className="border-none shadow-md bg-card overflow-hidden transition-all duration-300 ease-in-out"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}>

  {/* HEADER CLICKABLE */}
  <div 
    className="bg-muted p-2 text-foreground text-[11px] uppercase tracking-widest text-center font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-gray-700"
  >
    <ShieldCheck className="w-4 h-4 text-blue-500" />
    Admin Control Panel
    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
  </div>

  {/* CONTENIDO */}
   <div 
      className={`transition-all duration-500 ease-in-out overflow-hidden ${
        isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
    <div className="p-5">

      {/* GRID MEJORADO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* SEARCH */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
            <User className="w-3 h-3 text-blue-500" /> Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Tech or title..."
              className="pl-9 bg-background border-border text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* DATE */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
            <Calendar className="w-3 h-3 text-blue-500" /> Date
          </label>
          <Input 
            type="date"
            className="bg-background border-border text-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        {/* CATEGORY */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase">
            Category
          </label>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
            <SelectTrigger className="bg-background border-border text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="hardware">Hardware</SelectItem>
              <SelectItem value="software">Software</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* PRIORITY */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
            <BarChart3 className="w-3 h-3 text-blue-500" /> Priority
          </label>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
            <SelectTrigger className="bg-background border-border text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* LOCATION */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
            <MapPin className="w-3 h-3 text-blue-500" /> Location
          </label>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="bg-background border-border text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {locationOptions.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>

      {/* RESET BUTTON */}
      {hasFiltersActive && (
        <div className="mt-4 flex justify-end">
          <button 
            onClick={resetFilters}
            className="text-xs flex items-center gap-2 text-blue-500 hover:text-red-500 transition-all font-semibold"
          >
            <XCircle className="w-4 h-4" /> Reset Filters
          </button>
        </div>
      )}

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