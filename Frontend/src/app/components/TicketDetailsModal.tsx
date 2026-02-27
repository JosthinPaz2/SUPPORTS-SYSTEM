import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Ticket, TicketStatus, TicketCategory } from '../types/ticket';
import { Clock, User, Tag, AlertCircle, MessageSquare, MapPin } from 'lucide-react';

interface TicketDetailsModalProps {
  ticket: Ticket;
  onClose: () => void;
  isAdmin: boolean;
}

const statusLabels: Record<TicketStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
};

const categoryLabels: Record<TicketCategory, string> = {
  hardware: 'Hardware',
  software: 'Software',
  other: 'Other',
};

const statusColors: Record<TicketStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800',
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const technicians = [
  { id: 'tech-1', name: 'Carlos Rodríguez' },
  { id: 'tech-2', name: 'Laura Martínez' },
  { id: 'tech-3', name: 'Pedro Sánchez' },
  { id: 'tech-4', name: 'Sofia Torres' },
];

export default function TicketDetailsModal({ ticket, onClose, isAdmin }: TicketDetailsModalProps) {
  const { user } = useAuth();
  const { updateTicket, addComment } = useTickets();
  const [comment, setComment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  const handleStatusChange = (newStatus: TicketStatus) => {
    updateTicket(ticket.id, { status: newStatus });
  };

  const handleAssignTechnician = (techId: string) => {
    const tech = technicians.find((t) => t.id === techId);
    updateTicket(ticket.id, {
      assignedTo: techId,
      assignedToName: tech?.name,
    });
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;

    addComment(ticket.id, {
      ticketId: ticket.id,
      userId: user?.id || '',
      userName: user?.name || '',
      content: comment,
      isInternal: isInternalNote,
    });

    setComment('');
    setIsInternalNote(false);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  // Filter comments based on user role
  const visibleComments = isAdmin
    ? ticket.comments
    : ticket.comments.filter((c) => !c.isInternal);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{ticket.title}</span>
            <Badge className={statusColors[ticket.status]}>
              {statusLabels[ticket.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Tag className="w-4 h-4" />
                Category
              </div>
              <div className="font-medium">{categoryLabels[ticket.category]}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4" />
                Priority
              </div>
              <Badge className={priorityColors[ticket.priority]}>
                {priorityLabels[ticket.priority]}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                Created by
              </div>
              <div className="font-medium">{ticket.createdByName}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                Date & Time
              </div>
              <div className="font-medium text-sm">
                {formatDateTime(ticket.createdAt)}
              </div>
            </div>
          </div>

          {/* Location */}
          {ticket.location && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                Desk Location
              </div>
              <div className="font-medium">{ticket.location}</div>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-md">
              {ticket.description}
            </p>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Change Status</Label>
                  <Select value={ticket.status} onValueChange={(value) => handleStatusChange(value as TicketStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assign Technician</Label>
                  <Select value={ticket.assignedTo || ''} onValueChange={handleAssignTechnician}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Comments */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comments ({visibleComments.length})
            </h3>
            
            <div className="space-y-4 mb-4">
              {visibleComments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No comments yet
                </p>
              ) : (
                visibleComments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-4 rounded-lg ${
                      c.isInternal
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.userName}</span>
                        {c.isInternal && (
                          <Badge variant="outline" className="text-xs">
                            Internal note
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDateTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            <div className="space-y-3 border-t pt-4">
              <Label>Add {isAdmin && isInternalNote ? 'Internal Note' : 'Comment'}</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your comment..."
                rows={3}
              />
              <div className="flex items-center justify-between">
                {isAdmin && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded"
                    />
                    <span>Internal note (visible only to admins)</span>
                  </label>
                )}
                <Button onClick={handleAddComment} disabled={!comment.trim()}>
                  Add Comment
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
