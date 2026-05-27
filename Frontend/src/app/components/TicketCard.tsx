import { useDrag } from 'react-dnd';
import { Card, CardContent } from './ui/card';
import { Badge } from '../components/ui/badge';
import { Ticket, TicketCategory } from '../types/ticket';
import { Clock, User, Tag, AlertCircle, MapPin, Route } from 'lucide-react';
import { formatBogotaDate } from '../utils/datetime';

interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
}

const categoryLabels: Record<TicketCategory, string> = {
  hardware: 'Hardware',
  software: 'Software',
  other: 'Other',
};

const priorityColors = {
  low: 'bg-slate-600 text-slate-200 hover:bg-slate-500',
  medium: 'bg-blue-600 text-blue-100 hover:bg-blue-500',
  high: 'bg-red-600 text-red-100 hover:bg-red-500',
  urgent: 'bg-orange-600 text-orange-100 hover:bg-orange-500',
};

export default function TicketCard({ ticket, onClick }: TicketCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TICKET',
    item: { id: ticket.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const priorityKey = ticket.priority as keyof typeof priorityColors;
  const pColor = priorityColors[priorityKey] || priorityColors.low;

  return (
    <div ref={(node) => { drag(node); }} className={isDragging ? 'opacity-50' : 'opacity-100'}>
    <Card
      className="cursor-pointer bg-slate-800/90 border-slate-700 hover:border-teal-500/50 hover:bg-slate-750 hover:shadow-md hover:shadow-black/30 transition-all duration-200 text-slate-100 backdrop-blur-sm"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm line-clamp-2 flex-1 text-white group-hover:text-teal-300 transition-colors">
              {ticket.title}
            </h3>
            <Badge className={`${pColor} px-2 py-0 text-[10px] font-medium rounded-full border-none`}>
              {ticket.priority === 'low' && 'Low'}
              {ticket.priority === 'medium' && 'Medium'}
              {ticket.priority === 'high' && 'High'}
              {ticket.priority === 'urgent' && 'Urgent'}
            </Badge>
          </div>

          <p className="text-xs text-slate-400 line-clamp-2">
            {ticket.description}
          </p>

          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-teal-400/80" />
              <span>{categoryLabels[ticket.category]}</span>
            </div>
            {ticket.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-teal-500/70" />
                <span className="truncate">Desk {ticket.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <User className="w-3 h-3 text-blue-500/70" />
              <span className="truncate">{ticket.createdByName}</span>
            </div>
            {ticket.movedByName && (
              <div className="flex items-center gap-1">
                <Route className="w-3 h-3 text-teal-500/70" />
                <span className="truncate">Moved by: {ticket.movedByName}</span>
              </div>
            )}
            {ticket.assignedToName && (
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-teal-400/80" />
                <span className="truncate">Primero: {ticket.assignedToName}</span>
              </div>
            )}
            {ticket.secondaryTechnicianName && (
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-teal-400/80" />
                <span className="truncate">Segundo: {ticket.secondaryTechnicianName}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{formatBogotaDate(ticket.createdAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}