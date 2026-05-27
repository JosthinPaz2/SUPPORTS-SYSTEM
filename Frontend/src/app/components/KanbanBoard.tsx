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
    pending: { 
      title: 'Pending', 
      color: 'border-t-amber-500 bg-amber-900/30 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]', 
      headerColor: 'bg-amber-500/20 border-b-amber-500/30',
      titleColor: 'text-amber-400', 
      badge: 'bg-amber-500 text-amber-950' 
    },
    'in-progress': { 
      title: 'In Progress', 
      color: 'border-t-blue-500 bg-blue-900/30 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]', 
      headerColor: 'bg-blue-500/20 border-b-blue-500/30',
      titleColor: 'text-blue-400', 
      badge: 'bg-blue-500 text-blue-950' 
    },
    resolved: { 
      title: 'Resolved', 
      color: 'border-t-emerald-500 bg-emerald-900/30 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]', 
      headerColor: 'bg-emerald-500/20 border-b-emerald-500/30',
      titleColor: 'text-emerald-400', 
      badge: 'bg-emerald-500 text-emerald-950' 
    },
  };

  const config = statusConfig[status];

  return (
    <div
      ref={(node) => { drop(node); }}
      className={`flex-1 min-h-[500px] transition-all duration-300 rounded-xl ${isOver ? 'scale-[1.02] ring-2 ring-white/20' : ''}`}
    >
      <Card className={`h-full border border-t-4 shadow-xl backdrop-blur-md ${config.color}`}>
        <CardHeader className={`pb-3 border-b rounded-t-sm ${config.headerColor}`}>
          <CardTitle className={`flex items-center justify-between text-lg font-bold ${config.titleColor}`}>
            <span>{config.title}</span>
            <Badge className={`${config.badge} px-2.5 py-0.5 rounded-md`}>
              {totalCount ?? tickets.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4 px-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={() => onTicketClick(ticket)} />
          ))}
          {tickets.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm italic border-2 border-dashed border-gray-700/50 rounded-xl bg-gray-800/20">
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
          className="border border-gray-700/80 shadow-2xl bg-gray-900/95 backdrop-blur-md overflow-hidden transition-all duration-300 ease-in-out"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}>

  {/* HEADER CLICKABLE */}
  <div 
    className="bg-gray-800 p-2 text-gray-300 text-[11px] uppercase tracking-widest text-center font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-gray-700 hover:text-white"
  >
    <ShieldCheck className="w-4 h-4 text-teal-400" />
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
          <label className="text-[11px] font-semibold text-gray-400 uppercase flex items-center gap-1">
            <User className="w-3 h-3 text-teal-400" /> Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
            <Input 
              placeholder="Tech or title..."
              className="pl-9 !bg-slate-800 !border-slate-600 !text-slate-100 placeholder:!text-slate-400 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* DATE */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-400 uppercase flex items-center gap-1">
            <Calendar className="w-3 h-3 text-teal-400" /> Date
          </label>
          <Input 
            type="date"
            className="!bg-slate-800 !border-slate-600 !text-slate-100 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 min-h-[36px]"
            style={{ colorScheme: 'dark' }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        {/* CATEGORY */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-400 uppercase">
            Category
          </label>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
            <SelectTrigger className="bg-gray-800/80 border-gray-700 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="hardware">Hardware</SelectItem>
              <SelectItem value="software">Software</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* PRIORITY */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-400 uppercase flex items-center gap-1">
            <BarChart3 className="w-3 h-3 text-teal-400" /> Priority
          </label>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
            <SelectTrigger className="bg-gray-800/80 border-gray-700 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
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
          <label className="text-[11px] font-semibold text-gray-400 uppercase flex items-center gap-1">
            <MapPin className="w-3 h-3 text-teal-400" /> Location
          </label>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="bg-gray-800/80 border-gray-700 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white max-h-[300px]">
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
            className="text-xs flex items-center gap-2 text-red-500 hover:text-red-400 transition-all font-semibold"
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