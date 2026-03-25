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
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800',
};

export default function TicketCard({ ticket, onClick }: TicketCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TICKET',
    item: { id: ticket.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div ref={(node) => { drag(node); }} className={isDragging ? 'opacity-50' : 'opacity-100'}>
    <Card
      className="cursor-pointer hover:shadow-md transition-all"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm line-clamp-2 flex-1">
              {ticket.title}
            </h3>
            <Badge className={priorityColors[ticket.priority]} variant="secondary">
              {ticket.priority === 'low' && 'Low'}
              {ticket.priority === 'medium' && 'Medium'}
              {ticket.priority === 'high' && 'High'}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2">
            {ticket.description}
          </p>

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>{categoryLabels[ticket.category]}</span>
            </div>
            {ticket.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">Desk {ticket.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span className="truncate">{ticket.createdByName}</span>
            </div>
            {ticket.movedByName && (
              <div className="flex items-center gap-1">
                <Route className="w-3 h-3" />
                <span className="truncate">Moved by: {ticket.movedByName}</span>
              </div>
            )}
            {ticket.assignedToName && (
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span className="truncate">Primero: {ticket.assignedToName}</span>
              </div>
            )}
            {ticket.secondaryTechnicianName && (
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span className="truncate">Segundo: {ticket.secondaryTechnicianName}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatBogotaDate(ticket.createdAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
