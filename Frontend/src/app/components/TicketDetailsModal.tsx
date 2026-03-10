import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { apiService, UserListItemDto, CommentDto, ChangeHistoryDto } from '../utils/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Ticket, TicketStatus, TicketCategory, Comment } from '../types/ticket';
import { Clock, User, Tag, AlertCircle, MessageSquare, MapPin, Reply, X, History, CheckCircle2, CalendarClock, CalendarPlus } from 'lucide-react';

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



export default function TicketDetailsModal({ ticket, onClose, isAdmin }: TicketDetailsModalProps) {
  const { user } = useAuth();
  const { updateTicket } = useTickets();
  const [comment, setComment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [technicians, setTechnicians] = useState<UserListItemDto[]>([]);
  const [primaryTechId, setPrimaryTechId] = useState<string>('');
  const [secondaryTechId, setSecondaryTechId] = useState<string>('');
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [usersById, setUsersById] = useState<Map<number, string>>(new Map());
  const [activeTab, setActiveTab] = useState<'comments' | 'internal'>('comments');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [changeHistory, setChangeHistory] = useState<ChangeHistoryDto[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingTechs, setSavingTechs] = useState(false);
  const [viewerPrimaryTechName, setViewerPrimaryTechName] = useState<string | undefined>(ticket.assignedToName);
  const [viewerSecondaryTechName, setViewerSecondaryTechName] = useState<string | undefined>(ticket.secondaryTechnicianName);

  useEffect(() => {
    if (!isAdmin) return;
    const loadTechs = async () => {
      setLoadingTechs(true);
      try {
        const [users, fresh] = await Promise.all([
          apiService.getUsers(),
          apiService.getTicket(ticket.id),
        ]);
        setTechnicians(users.filter((u) => u.id_role === 1));
        setPrimaryTechId(fresh.primary_technician ? String(fresh.primary_technician) : '');
        setSecondaryTechId(fresh.secondary_technician ? String(fresh.secondary_technician) : '');
      } catch {
        // non-critical
      } finally {
        setLoadingTechs(false);
      }
    };
    loadTechs();
  }, [ticket.id, isAdmin]);

  useEffect(() => {
    const loadComments = async () => {
      setLoadingComments(true);
      try {
        const [rawComments, users] = await Promise.all([
          apiService.getCommentsByTicket(ticket.id),
          apiService.getUsers(),
        ]);
        const byId = new Map(users.map((u) => [u.id_user, u.full_name]));
        setUsersById(byId);
        setLocalComments(
          rawComments.map((c: CommentDto) => ({
            id: String(c.id_comment),
            ticketId: String(c.id_ticket),
            userId: String(c.id_user),
            userName: byId.get(c.id_user) ?? `User #${c.id_user}`,
            content: c.content,
            isInternal: c.internal_note ?? false,
            createdAt: new Date(c.created_at),
          }))
        );

        // For employee view, refresh technician names from latest ticket data.
        if (!isAdmin) {
          const fresh = await apiService.getTicket(ticket.id);
          setViewerPrimaryTechName(
            fresh.primary_technician != null
              ? (byId.get(fresh.primary_technician) ?? `User #${fresh.primary_technician}`)
              : undefined
          );
          setViewerSecondaryTechName(
            fresh.secondary_technician != null
              ? (byId.get(fresh.secondary_technician) ?? `User #${fresh.secondary_technician}`)
              : undefined
          );
        }
      } catch {
        // non-critical — show empty list on error
      } finally {
        setLoadingComments(false);
      }
    };
    loadComments();
  }, [ticket.id, isAdmin]);

  const handleStatusChange = (newStatus: TicketStatus) => {
    updateTicket(ticket.id, { status: newStatus });
  };

  const handleSaveAssignments = async () => {
    setSavingTechs(true);
    try {
      await apiService.updateTicket(Number(ticket.id), {
        primary_technician: primaryTechId && primaryTechId !== 'none' ? Number(primaryTechId) : undefined,
        secondary_technician: secondaryTechId && secondaryTechId !== 'none' ? Number(secondaryTechId) : undefined,
      });
      toast.success('Technicians saved successfully');
    } catch (error) {
      toast.error((error as Error).message || 'Could not save assignments');
    } finally {
      setSavingTechs(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !user?.id) return;
    setSubmittingComment(true);
    try {
      const saved = await apiService.createComment({
        id_ticket: Number(ticket.id),
        id_user: Number(user.id),
        content: comment.trim(),
        internal_note: isInternalNote,
      });
      const newComment: Comment = {
        id: String(saved.id_comment),
        ticketId: String(saved.id_ticket),
        userId: String(saved.id_user),
        userName: usersById.get(saved.id_user) ?? user.name ?? `User #${saved.id_user}`,
        content: saved.content,
        isInternal: saved.internal_note ?? false,
        createdAt: new Date(saved.created_at),
      };
      setLocalComments((prev) => [...prev, newComment]);
      setComment('');
      setIsInternalNote(false);
      setReplyingTo(null);
    } catch (error) {
      toast.error((error as Error).message || 'Could not save comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleOpenHistory = async () => {
    setShowHistory(true);
    if (changeHistory.length > 0) return;
    setLoadingHistory(true);
    try {
      // Prefer station-level history so you see ALL past resolutions for this desk
      const history = ticket.location
        ? await apiService.getChangesByStation(ticket.location)
        : await apiService.getChangesByTicket(ticket.id);
      setChangeHistory(history);
    } catch {
      toast.error('Could not load change history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleReply = (c: Comment) => {
    setReplyingTo(c);
    setIsInternalNote(c.isInternal);
    setActiveTab(c.isInternal ? 'internal' : 'comments');
    setTimeout(() => textareaRef.current?.focus(), 50);
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

  const publicComments = localComments.filter((c) => {
    if (c.isInternal) return false;
    return isAdmin || String(user?.id) === String(ticket.createdBy);
  });
  const internalComments = isAdmin ? localComments.filter((c) => c.isInternal) : [];
  const tabComments = activeTab === 'internal' ? internalComments : publicComments;

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

          {/* Employee view: show technicians attending */}
          {!isAdmin && (viewerPrimaryTechName || viewerSecondaryTechName) && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Technicians Attending</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="text-xs text-blue-700 font-medium">First Technician</div>
                    <div className="text-sm font-semibold text-blue-900 mt-1">
                      {viewerPrimaryTechName ?? 'Not assigned'}
                    </div>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3">
                    <div className="text-xs text-indigo-700 font-medium">Second Technician</div>
                    <div className="text-sm font-semibold text-indigo-900 mt-1">
                      {viewerSecondaryTechName ?? 'Not assigned'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Admin Controls */}
          {isAdmin && (
            <>
              <Separator />
              <div className="space-y-4">
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
                    <Label>Primary Technician</Label>
                    <Select value={primaryTechId} onValueChange={setPrimaryTechId} disabled={loadingTechs}>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingTechs ? 'Loading...' : 'Assign primary'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None —</SelectItem>
                        {technicians.map((tech) => (
                          <SelectItem key={tech.id_user} value={String(tech.id_user)}>
                            {tech.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-end gap-4">
                  <div className="space-y-2">
                    <Label>Secondary Technician</Label>
                    <Select value={secondaryTechId} onValueChange={setSecondaryTechId} disabled={loadingTechs}>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingTechs ? 'Loading...' : 'Assign secondary'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None —</SelectItem>
                        {technicians.map((tech) => (
                          <SelectItem key={tech.id_user} value={String(tech.id_user)}>
                            {tech.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSaveAssignments} disabled={savingTechs || loadingTechs}>
                    {savingTechs ? 'Saving…' : 'Save assignments'}
                  </Button>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Comments */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold">Comments</h3>
            </div>

            {/* Tab nav */}
            <div className="flex border-b mb-4">
              <button
                onClick={() => setActiveTab('comments')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'comments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Public
                <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                  {publicComments.length}
                </span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('internal')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'internal'
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Internal Notes
                  <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">
                    {internalComments.length}
                  </span>
                </button>
              )}
            </div>

            <div className="space-y-4 mb-4">
              {loadingComments ? (
                <p className="text-gray-500 text-center py-4">Loading comments…</p>
              ) : tabComments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No {activeTab === 'internal' ? 'internal notes' : 'comments'} yet
                </p>
              ) : (
                tabComments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-4 rounded-lg ${
                      c.isInternal
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.userName}</span>
                        {c.isInternal && (
                          <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">
                            Internal note
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                        <button
                          onClick={() => handleReply(c)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors"
                          title="Reply"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          Reply
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            <div className="space-y-3 border-t pt-4">
              {replyingTo && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-sm">
                  <span className="text-blue-700">
                    <span className="font-medium">Replying to {replyingTo.userName}:</span>{' '}
                    <span className="text-blue-500 line-clamp-1">{replyingTo.content}</span>
                  </span>
                  <button onClick={() => setReplyingTo(null)} title="Cancel reply" className="ml-2 text-blue-400 hover:text-blue-600 shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <Label>Add {isAdmin && isInternalNote ? 'Internal Note' : 'Comment'}</Label>
              <Textarea
                ref={textareaRef}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={replyingTo ? `Reply to ${replyingTo.userName}…` : 'Write your comment...'}
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
                {!isAdmin && <span />}
                <Button onClick={handleAddComment} disabled={!comment.trim() || submittingComment}>
                  {submittingComment ? 'Saving…' : replyingTo ? 'Post Reply' : 'Add Comment'}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Change History Panel */}
          {isAdmin && showHistory && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <History className="w-4 h-4 text-gray-600" />
                  {ticket.location
                    ? `Change History — Desk ${ticket.location}`
                    : 'Change History'}
                </div>
                <button
                  title="Close history"
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y max-h-80 overflow-y-auto">
                {loadingHistory ? (
                  <p className="text-gray-500 text-center py-6 text-sm">Loading history…</p>
                ) : changeHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-6 text-sm">No changes recorded for this ticket.</p>
                ) : (
                  changeHistory.map((h) => {
                    const priorityColor: Record<string, string> = {
                      low: 'bg-gray-100 text-gray-700',
                      medium: 'bg-orange-100 text-orange-700',
                      high: 'bg-red-100 text-red-700',
                      urgent: 'bg-purple-100 text-purple-700',
                    };
                    const rawPriority = (h.ticket_priority ?? '').toLowerCase();
                    const rawStatus = (h.ticket_status ?? '').toLowerCase();
                    const statusColor: Record<string, string> = {
                      pending: 'bg-yellow-100 text-yellow-700',
                      'in progress': 'bg-blue-100 text-blue-700',
                      resolved: 'bg-green-100 text-green-700',
                    };
                    return (
                      <div key={h.id_change} className="px-4 py-4 space-y-2">
                        {/* Row 1: title + badges */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-sm text-gray-800 flex-1">
                            {h.ticket_title ?? `Ticket #${h.id_ticket}`}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {h.ticket_priority && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[rawPriority] ?? 'bg-gray-100 text-gray-700'}`}>
                                {h.ticket_priority}
                              </span>
                            )}
                            {h.ticket_status && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[rawStatus] ?? 'bg-gray-100 text-gray-700'}`}>
                                {h.ticket_status}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Row 2: description */}
                        {h.ticket_description && (
                          <p className="text-xs text-gray-600 line-clamp-2">{h.ticket_description}</p>
                        )}
                        {/* Row 3: change note */}
                        <p className="text-xs text-gray-700 italic">{h.change_description ?? '—'}</p>
                        {/* Row 3.1: internal notes from the case */}
                        {h.internal_notes && h.internal_notes.length > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-md p-2 space-y-1">
                            <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
                              Internal Notes ({h.internal_notes.length})
                            </p>
                            {h.internal_notes.slice(0, 3).map((note) => (
                              <div key={note.id_comment} className="text-xs text-amber-900">
                                <span className="font-medium">
                                  {usersById.get(note.id_user) ?? `User #${note.id_user}`}:
                                </span>{' '}
                                <span>{note.content}</span>
                              </div>
                            ))}
                            {h.internal_notes.length > 3 && (
                              <p className="text-[11px] text-amber-700">
                                +{h.internal_notes.length - 3} more internal notes
                              </p>
                            )}
                          </div>
                        )}
                        {/* Row 4: meta */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                          {h.ticket_station && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> Desk {h.ticket_station}
                            </span>
                          )}
                          {h.reported_by !== null && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" /> Reported by {usersById.get(h.reported_by ?? -1) ?? `User #${h.reported_by}`}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" /> Resolved by {usersById.get(h.action_user) ?? `User #${h.action_user}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarClock className="w-3 h-3" /> {formatDateTime(new Date(h.created_at))}
                          </span>
                          {h.ticket_created_at && (
                            <span className="flex items-center gap-1">
                              <CalendarPlus className="w-3 h-3" /> Opened {formatDateTime(new Date(h.ticket_created_at))}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            {isAdmin ? (
              <Button variant="outline" onClick={handleOpenHistory} className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Change History
              </Button>
            ) : (
              <span />
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
