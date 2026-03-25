import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { apiService, UserListItemDto, CommentDto, ChangeHistoryDto } from '../utils/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Ticket, TicketStatus, TicketCategory, Comment } from '../types/ticket';
import { Clock, User, Tag, AlertCircle, MessageSquare, MapPin, Reply, X, History, CalendarClock, Laptop, Save, ShieldCheck } from 'lucide-react';
import { formatBogotaDateTime } from '../utils/datetime';

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

const hardwareComponentLabels: Record<string, string> = {
  teclado: 'Teclado ESENSES Basico USB',
  mouse: 'Mouse Alambrico HP Optico negro 100',
  ethernet: 'Ethernet 3.0 LAN a USB',
  'cable-vga': 'Cable Display Port a VGA 18',
  'cable-vga-vga': 'Cable Display VGA a VGA 18',
  extension: 'Extension de Cable electrico',
  'cable-hdmi': 'Cable Display Port a HDMI 18',
};

const assetStatusLabels: Record<string, string> = {
  repair: 'Needs Repair',
  replace: 'Needs Replacement',
  tested: 'Operational',
  maintenance: 'Missing',
};

const authorizationDecisionLabels: Record<string, string> = {
  approved: 'Accepted change',
  rejected: 'Not accepted',
  preapproved_more_specs: 'Pre-approved, needs more specifications',
};

const authorizationStatusBadge: Record<string, { label: string; className: string }> = {
  approved: {
    label: 'Authorized',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  preapproved_more_specs: {
    label: 'Pre-approved (needs specs)',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
};

function parseCategoryDetailToMap(rawDetail?: string): Map<string, string> {
  if (!rawDetail) {
    return new Map<string, string>();
  }

  const trimmed = rawDetail.trim();
  if (!trimmed) {
    return new Map<string, string>();
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const map = new Map<string, string>();
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'string') {
          map.set(key, value);
        }
      }
      return map;
    } catch {
      return new Map<string, string>();
    }
  }

  const map = new Map<string, string>();
  for (const part of trimmed.split(';').map((entry) => entry.trim()).filter(Boolean)) {
    const separatorIndex = part.indexOf(':');
    if (separatorIndex < 0) {
      continue;
    }

    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    if (key) {
      map.set(key, value);
    }
  }

  return map;
}

function serializeCategoryDetail(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
}

function mergeCategoryDetail(rawDetail: string | undefined, updates: Record<string, string | undefined>): string {
  const detailMap = parseCategoryDetailToMap(rawDetail);

  for (const [key, value] of Object.entries(updates)) {
    if (!value) {
      detailMap.delete(key);
      continue;
    }
    detailMap.set(key, value);
  }

  return serializeCategoryDetail(detailMap);
}

function parseHardwareCategoryDetail(rawDetail?: string): { component: string; status: string } {
  if (!rawDetail) {
    return { component: '', status: '' };
  }

  const trimmed = rawDetail.trim();

  // Supports JSON payloads and the current key:value;key:value format.
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as {
        hardware_component?: string;
        asset_status?: string;
      };
      return {
        component: parsed.hardware_component ?? '',
        status: parsed.asset_status ?? '',
      };
    } catch {
      return { component: '', status: '' };
    }
  }

  const entries = trimmed
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf(':');
      if (separatorIndex < 0) {
        return ['', ''];
      }
      return [part.slice(0, separatorIndex).trim(), part.slice(separatorIndex + 1).trim()];
    });

  const detailMap = new Map(entries as Array<[string, string]>);
  return {
    component: detailMap.get('hardware_component') ?? '',
    status: detailMap.get('asset_status') ?? '',
  };
}

function buildDescriptionWithHardware(baseDescription: string, component: string, status: string): string {
  const deviceTypeLabel = hardwareComponentLabels[component] ?? component;
  const assetStatusLabel = assetStatusLabels[status] ?? status;

  const hardwareBlock = [
    '[Hardware Details]',
    `Device Type: ${deviceTypeLabel}`,
    `Asset Condition: ${assetStatusLabel}`,
    '[/Hardware Details]',
  ].join('\n');

  const existingBlockRegex = /\[Hardware Details\][\s\S]*?\[\/Hardware Details\]/g;
  const cleanBase = (baseDescription ?? '').trim();

  if (existingBlockRegex.test(cleanBase)) {
    return cleanBase.replace(existingBlockRegex, hardwareBlock).trim();
  }

  return cleanBase ? `${cleanBase}\n\n${hardwareBlock}` : hardwareBlock;
}

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

  const [hardwareComponent, setHardwareComponent] = useState<string>('');
  const [assetStatus, setAssetStatus] = useState<string>('');
  const [savingHardwareDetails, setSavingHardwareDetails] = useState(false);
  const [showAuthorizationModal, setShowAuthorizationModal] = useState(false);
  const [authorizationInternalComment, setAuthorizationInternalComment] = useState('');
  const [submittingAuthorizationDecision, setSubmittingAuthorizationDecision] = useState(false);
  const [authorizationDecision, setAuthorizationDecision] = useState<string>('');

  const canManageHardwareDetails = isAdmin && Number(user?.id) !== 1;
  const canAuthorizeTicket = isAdmin;
  const canShowHardwareSaveButton =
    canManageHardwareDetails && hardwareComponent.trim() !== '' && assetStatus.trim() !== '';

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
        toast.error('Could not load technicians');
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
        toast.error('Could not load comments');
      } finally {
        setLoadingComments(false);
      }
    };
    loadComments();
  }, [ticket.id, isAdmin]);

  useEffect(() => {
    if (ticket.category !== 'hardware') {
      return;
    }

    const parsed = parseHardwareCategoryDetail(ticket.categoryDetail);
    setHardwareComponent(parsed.component);
    setAssetStatus(parsed.status);
  }, [ticket.id, ticket.category, ticket.categoryDetail]);

  useEffect(() => {
    const parsed = parseCategoryDetailToMap(ticket.categoryDetail);
    setAuthorizationDecision(parsed.get('authorization_decision') ?? '');
  }, [ticket.id, ticket.categoryDetail]);

  const handleStatusChange = (newStatus: TicketStatus) => {
    updateTicket(ticket.id, { status: newStatus });
  };

  const handleSaveAssignments = async () => {
    setSavingTechs(true);
    try {
      await apiService.updateTicket(Number(ticket.id), {
        primary_technician: primaryTechId && primaryTechId !== 'none' ? Number(primaryTechId) : null,
        secondary_technician: secondaryTechId && secondaryTechId !== 'none' ? Number(secondaryTechId) : null,
        moved_by: user?.id ? Number(user.id) : undefined,
      });
      toast.success('Assignments saved successfully');
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

  const handleSaveHardwareDetails = async () => {
    if (!canShowHardwareSaveButton) {
      return;
    }

    setSavingHardwareDetails(true);
    try {
      const savedDetail = mergeCategoryDetail(ticket.categoryDetail, {
        hardware_component: hardwareComponent,
        asset_status: assetStatus,
      });
      const descriptionWithHardware = buildDescriptionWithHardware(
        ticket.description ?? '',
        hardwareComponent,
        assetStatus,
      );
      const updatedTicket = await apiService.updateTicket(Number(ticket.id), {
        category_detail: savedDetail,
        description: descriptionWithHardware,
        moved_by: user?.id ? Number(user.id) : undefined,
      });

      const parsedFromDb = parseHardwareCategoryDetail(updatedTicket.category_detail ?? undefined);
      setHardwareComponent(parsedFromDb.component || hardwareComponent);
      setAssetStatus(parsedFromDb.status || assetStatus);

      if (updatedTicket.category_detail) {
        toast.success('Hardware information saved in ticket');
      } else {
        toast.warning('Saved, but no hardware detail came back from server');
      }
    } catch (error) {
      toast.error((error as Error).message || 'Could not save hardware information');
    } finally {
      setSavingHardwareDetails(false);
    }
  };

  const handleAuthorizationDecision = async (
    decision: 'approved' | 'rejected' | 'preapproved_more_specs',
  ) => {
    if (!canAuthorizeTicket || !user?.id) {
      return;
    }

    setSubmittingAuthorizationDecision(true);
    try {
      const decisionLabel = authorizationDecisionLabels[decision];
      const updatedDetail = mergeCategoryDetail(ticket.categoryDetail, {
        authorization_decision: decision,
        authorization_by: String(user.id),
        authorization_updated_at: new Date().toISOString(),
      });

      await apiService.updateTicket(Number(ticket.id), {
        category_detail: updatedDetail,
        moved_by: Number(user.id),
      });

      const commentPrefix = `[Authorization] ${decisionLabel}`;
      const decisionComment = authorizationInternalComment.trim()
        ? `${commentPrefix}\n${authorizationInternalComment.trim()}`
        : commentPrefix;

      const savedComment = await apiService.createComment({
        id_ticket: Number(ticket.id),
        id_user: Number(user.id),
        content: decisionComment,
        internal_note: true,
      });

      const newComment: Comment = {
        id: String(savedComment.id_comment),
        ticketId: String(savedComment.id_ticket),
        userId: String(savedComment.id_user),
        userName: usersById.get(savedComment.id_user) ?? user.name ?? `User #${savedComment.id_user}`,
        content: savedComment.content,
        isInternal: savedComment.internal_note ?? false,
        createdAt: new Date(savedComment.created_at),
      };
      setLocalComments((prev) => [...prev, newComment]);

      let publicDecisionMessage: string | undefined;
      if (decision === 'approved') {
        publicDecisionMessage = 'Cambio autorizado, proximamente se hara.';
      }
      if (decision === 'rejected') {
        publicDecisionMessage = 'No se acepto el cambio, por politicas de IT.';
      }
      if (decision === 'preapproved_more_specs') {
        publicDecisionMessage = 'Cambio preaprobado. Se requieren mas especificaciones para ejecutarlo.';
      }

      if (publicDecisionMessage) {
        const savedPublicComment = await apiService.createComment({
          id_ticket: Number(ticket.id),
          id_user: Number(user.id),
          content: publicDecisionMessage,
          internal_note: false,
        });

        const newPublicComment: Comment = {
          id: String(savedPublicComment.id_comment),
          ticketId: String(savedPublicComment.id_ticket),
          userId: String(savedPublicComment.id_user),
          userName: usersById.get(savedPublicComment.id_user) ?? user.name ?? `User #${savedPublicComment.id_user}`,
          content: savedPublicComment.content,
          isInternal: savedPublicComment.internal_note ?? false,
          createdAt: new Date(savedPublicComment.created_at),
        };
        setLocalComments((prev) => [...prev, newPublicComment]);
      }

      setAuthorizationInternalComment('');
      setAuthorizationDecision(decision);
      setActiveTab('internal');
      setShowAuthorizationModal(false);
      toast.success('Authorization decision saved');
    } catch (error) {
      toast.error((error as Error).message || 'Could not save authorization decision');
    } finally {
      setSubmittingAuthorizationDecision(false);
    }
  };

  const publicComments = localComments.filter((c) => {
    if (c.isInternal) return false;
    return isAdmin || String(user?.id) === String(ticket.createdBy);
  });
  const internalComments = isAdmin ? localComments.filter((c) => c.isInternal) : [];
  const tabComments = activeTab === 'internal' ? internalComments : publicComments;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-sm text-card-foreground border-border">
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                Priority
              </div>
              <Badge className={priorityColors[ticket.priority]}>
                {priorityLabels[ticket.priority]}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                Created by
              </div>
              <div className="font-medium">{ticket.createdByName}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Date & Time
              </div>
              <div className="font-medium text-sm">
                {formatBogotaDateTime(ticket.createdAt)}
              </div>
            </div>
          </div>

          {authorizationDecision && authorizationStatusBadge[authorizationDecision] && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="w-4 h-4" />
                Authorization Status
              </div>
              <Badge className={authorizationStatusBadge[authorizationDecision].className}>
                {authorizationStatusBadge[authorizationDecision].label}
              </Badge>
            </div>
          )}

          {ticket.location && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                Desk Location
              </div>
              <div className="font-medium">{ticket.location}</div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-md">
              {ticket.description}
            </p>
          </div>

          {/* Employee view: Technicians */}
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

          {/* --- HARDWARE DETAILS SECTION --- */}
          {ticket.category === 'hardware' && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-900">Hardware Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-emerald-700">Device Type</Label>
                    <Select value={hardwareComponent} onValueChange={setHardwareComponent} disabled={!canManageHardwareDetails}>
                      <SelectTrigger className="bg-emerald-50 border-emerald-200">
                        <SelectValue placeholder="Select component..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teclado">Teclado ESENSES Básico USB</SelectItem>
                        <SelectItem value="mouse">Mouse Álambrico HP Óptico negro 100</SelectItem>
                        <SelectItem value="ethernet">Ethernet 3.0 LAN a USB</SelectItem>
                        <SelectItem value="cable-vga">Cable Display Port a VGA 18</SelectItem>
                        <SelectItem value="cable-vga-vga">Cable Display VGA a VGA 18</SelectItem>
                        <SelectItem value="extension">Extensión de Cable eléctrico</SelectItem>
                        <SelectItem value="cable-hdmi">Cable Display Port a HDMI 18</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-teal-700">Asset Condition</Label>
                    <Select value={assetStatus} onValueChange={setAssetStatus} disabled={!canManageHardwareDetails}>
                      <SelectTrigger className="bg-teal-50 border-teal-200">
                        <SelectValue placeholder="Current status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="repair">Needs Repair</SelectItem>
                        <SelectItem value="replace">Needs Replacement</SelectItem>
                        <SelectItem value="tested">Operational</SelectItem>
                        <SelectItem value="maintenance">Missing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {canShowHardwareSaveButton && (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveHardwareDetails}
                      disabled={savingHardwareDetails}
                      className="group gap-2 bg-black hover:bg-neutral-900 active:scale-[0.98] transition-all duration-200 text-emerald-300 border border-emerald-600/70 shadow-[0_0_0_1px_rgba(16,185,129,0.2)] hover:shadow-[0_0_0_2px_rgba(16,185,129,0.35)]"
                    >
                      <Save className={`w-4 h-4 ${savingHardwareDetails ? 'animate-spin' : 'group-hover:-translate-y-0.5 transition-transform'}`} />
                      {savingHardwareDetails ? 'Saving...' : 'Save hardware data'}
                    </Button>
                  </div>
                )}

                {canAuthorizeTicket && (
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setShowAuthorizationModal(true)}
                      className="gap-2 bg-black hover:bg-neutral-900 text-emerald-300 border border-emerald-600/70"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Authorize change
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Admin Controls */}
          {isAdmin && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    onClick={() => setShowAuthorizationModal(true)}
                    className="gap-2 bg-black hover:bg-neutral-900 text-emerald-300 border border-emerald-600/70"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Authorize change
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Change Status</Label>
                    <Select value={ticket.status} onValueChange={(value) => handleStatusChange(value as TicketStatus)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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

          {/* Comments Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold">Comments</h3>
            </div>
            <div className="flex border-b mb-4">
              <button
                onClick={() => setActiveTab('comments')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'comments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
                }`}
              >
                Public <span className="ml-1.5 bg-gray-100 px-1.5 py-0.5 rounded-full">{publicComments.length}</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('internal')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'internal' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500'
                  }`}
                >
                  Internal Notes <span className="ml-1.5 bg-amber-100 px-1.5 py-0.5 rounded-full">{internalComments.length}</span>
                </button>
              )}
            </div>

            <div className="space-y-4 mb-4">
              {loadingComments ? (
                <p className="text-gray-500 text-center py-4">Loading comments…</p>
              ) : tabComments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              ) : (
                tabComments.map((c) => (
                  <div key={c.id} className={`p-4 rounded-lg ${c.isInternal ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.userName}</span>
                        {c.isInternal && <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">Internal note</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{formatBogotaDateTime(c.createdAt)}</span>
                        <button onClick={() => handleReply(c)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500">
                          <Reply className="w-3.5 h-3.5" /> Reply
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 border-t pt-4">
              {replyingTo && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-sm">
                  <span className="text-blue-700"><span className="font-medium">Replying to {replyingTo.userName}:</span> {replyingTo.content}</span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-blue-400"
                    aria-label="Cancel reply"
                    title="Cancel reply"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <Label>Add {isAdmin && isInternalNote ? 'Internal Note' : 'Comment'}</Label>
              <Textarea
                ref={textareaRef}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your comment..."
                rows={3}
              />
              <div className="flex items-center justify-between">
                {isAdmin ? (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={isInternalNote} onChange={(e) => setIsInternalNote(e.target.checked)} className="rounded" />
                    <span>Internal note</span>
                  </label>
                ) : <span />}
                <Button onClick={handleAddComment} disabled={!comment.trim() || submittingComment}>
                  {submittingComment ? 'Saving…' : 'Add Comment'}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* History Panel */}
          {isAdmin && showHistory && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <History className="w-4 h-4 text-gray-600" />
                  History - Desk {ticket.location || 'N/A'}
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400"
                  aria-label="Close history"
                  title="Close history"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y max-h-80 overflow-y-auto">
                {loadingHistory ? <p className="text-center py-6 text-sm">Loading...</p> : 
                  changeHistory.map((h) => (
                    <div key={h.id_change} className="px-4 py-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-sm">{h.ticket_title}</span>
                        <Badge variant="outline">{h.ticket_status}</Badge>
                      </div>
                      <p className="text-xs text-gray-600">{h.change_description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><User className="w-3 h-3"/> {usersById.get(h.action_user)}</span>
                        <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3"/> {formatBogotaDateTime(h.created_at)}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            {isAdmin ? (
              <Button variant="outline" onClick={handleOpenHistory} className="gap-2">
                <History className="w-4 h-4" /> Change History
              </Button>
            ) : <span />}
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>

      {canAuthorizeTicket && (
        <Dialog open={showAuthorizationModal} onOpenChange={setShowAuthorizationModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Authorize change
              </DialogTitle>
              <DialogDescription>
                Review internal notes and choose the authorization result for this ticket.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-700">Internal notes (general view)</Label>
                <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-amber-200 bg-amber-50/40 p-3 space-y-2">
                  {internalComments.length === 0 ? (
                    <p className="text-sm text-gray-500">No internal notes yet.</p>
                  ) : (
                    internalComments.map((note) => (
                      <div key={note.id} className="rounded-md border border-amber-100 bg-white p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-amber-700">{note.userName}</span>
                          <span className="text-[11px] text-gray-500">{formatBogotaDateTime(note.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Internal comment for decision</Label>
                <Textarea
                  value={authorizationInternalComment}
                  onChange={(event) => setAuthorizationInternalComment(event.target.value)}
                  placeholder="Add internal context for this authorization..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button
                  onClick={() => handleAuthorizationDecision('approved')}
                  disabled={submittingAuthorizationDecision}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Accept change
                </Button>
                <Button
                  onClick={() => handleAuthorizationDecision('rejected')}
                  disabled={submittingAuthorizationDecision}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  Do not accept
                </Button>
                <Button
                  onClick={() => handleAuthorizationDecision('preapproved_more_specs')}
                  disabled={submittingAuthorizationDecision}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                 In Process
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}