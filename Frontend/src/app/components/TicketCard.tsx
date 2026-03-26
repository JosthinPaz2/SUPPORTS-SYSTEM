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
  low: 'bg-slate-800 text-slate-300 border-slate-700',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  urgent: 'bg-red-500/10 text-red-500 border-red-500/30',
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
      className="cursor-pointer bg-gray-900 border-gray-700 hover:border-gray-500 hover:shadow-lg hover:shadow-black/50 transition-all text-gray-200"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm line-clamp-2 flex-1 text-white">
              {ticket.title}
            </h3>
            <Badge className={pColor} variant="outline">
              {ticket.priority === 'low' && 'Low'}
              {ticket.priority === 'medium' && 'Medium'}
              {ticket.priority === 'high' && 'High'}
            </Badge>
          </div>

          <p className="text-xs text-gray-400 line-clamp-2">
            {ticket.description}
          </p>

          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-teal-400/80" />
              <span>{categoryLabels[ticket.category]}</span>
            </div>
            {ticket.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-teal-400/80" />
                <span className="truncate">Desk {ticket.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <User className="w-3 h-3 text-teal-400/80" />
              <span className="truncate">{ticket.createdByName}</span>
            </div>
            {ticket.movedByName && (
              <div className="flex items-center gap-1">
                <Route className="w-3 h-3 text-teal-400/80" />
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
              <Clock className="w-3 h-3 text-teal-400/80" />
              <span>{formatBogotaDate(ticket.createdAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
