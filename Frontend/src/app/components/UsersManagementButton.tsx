import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, Search, Copy, ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { apiService, UserListItemDto } from '../utils/api';
import { formatBogotaDateTime } from '../utils/datetime';

interface UsersManagementButtonProps {
  canEditRoles: boolean;
}

type UserDraft = {
  full_name: string;
  institutional_email: string;
  id_role: number;
};

const ROLE_OPTIONS = [
  { value: 1, label: 'Administrator' },
  { value: 2, label: 'Employee' },
];

const getRoleLabel = (roleId: number) => {
  const foundRole = ROLE_OPTIONS.find((role) => role.value === roleId);
  return foundRole?.label ?? `Role ${roleId}`;
};

const getAccountStatus = (lockedUntil?: string | null) => {
  if (!lockedUntil) return { label: 'Active', blocked: false };
  const parsed = new Date(lockedUntil);
  if (Number.isNaN(parsed.getTime())) return { label: 'Active', blocked: false };
  return parsed.getTime() > Date.now()
    ? { label: 'Blocked', blocked: true }
    : { label: 'Active', blocked: false };
};

export default function UsersManagementButton({ canEditRoles }: UsersManagementButtonProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<UserListItemDto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [userDrafts, setUserDrafts] = useState<Record<number, UserDraft>>({});

  const loadUsers = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const list = await apiService.getUsers();
      setUsers(list);
      setUserDrafts(
        list.reduce<Record<number, UserDraft>>((acc, user) => {
          acc[user.id_user] = {
            full_name: user.full_name,
            institutional_email: user.institutional_email,
            id_role: user.id_role,
          };
          return acc;
        }, {}),
      );
    } catch (error) {
      if (showLoading) {
        toast.error((error as Error).message || 'Could not load users');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    void loadUsers(true);

    const refreshInterval = setInterval(() => {
      void loadUsers(false);
    }, 5000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [open, loadUsers]);

  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return users;

    return users.filter((user) => {
      return (
        user.full_name.toLowerCase().includes(normalized) ||
        user.institutional_email.toLowerCase().includes(normalized) ||
        getRoleLabel(user.id_role).toLowerCase().includes(normalized) ||
        String(user.failed_login_attempts ?? 0).includes(normalized) ||
        (user.recovery_code ?? '').toLowerCase().includes(normalized)
      );
    });
  }, [users, search]);

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error('Could not copy text');
    }
  };

  const handleCopyVisibleRows = async () => {
    if (filteredUsers.length === 0) {
      toast.error('No rows to copy');
      return;
    }

    const lines = [
      'full_name\tinstitutional_email\tcurrent_role\taccount_status\trecovery_code\trecovery_code_expiration\tfailed_login_attempts\tlast_failed_login\tlocked_until',
      ...filteredUsers.map(
        (user) =>
          `${user.full_name}\t${user.institutional_email}\t${getRoleLabel(user.id_role)}\t${getAccountStatus(user.locked_until).label}\t${user.recovery_code ?? '-'}\t${user.recovery_code_expiration ?? '-'}\t${user.failed_login_attempts ?? 0}\t${user.last_failed_login ?? '-'}\t${user.locked_until ?? '-'}`,
      ),
    ];

    await copyText(lines.join('\n'), 'Visible table copied');
  };

  const handleRoleChange = (userId: number, nextRoleId: number) => {
    if (!canEditRoles) {
      toast.error('Only administrators can change roles');
      return;
    }

    setUserDrafts((prev) => {
      const current = prev[userId];
      if (!current) return prev;
      return {
        ...prev,
        [userId]: {
          ...current,
          id_role: nextRoleId,
        },
      };
    });
  };

  const handleDraftChange = (userId: number, field: 'full_name' | 'institutional_email', value: string) => {
    setUserDrafts((prev) => {
      const current = prev[userId];
      if (!current) return prev;
      return {
        ...prev,
        [userId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleSaveUserChanges = async (userId: number) => {
    if (!canEditRoles) {
      toast.error('Only administrators can edit users');
      return;
    }

    const original = users.find((user) => user.id_user === userId);
    const draft = userDrafts[userId];

    if (!original || !draft) return;

    const payload: {
      full_name?: string;
      institutional_email?: string;
      id_role?: number;
    } = {};

    const normalizedName = draft.full_name.trim();
    const normalizedEmail = draft.institutional_email.trim();

    if (!normalizedName) {
      toast.error('Full name cannot be empty');
      return;
    }

    if (!normalizedEmail) {
      toast.error('Email cannot be empty');
      return;
    }

    if (normalizedName !== original.full_name) payload.full_name = normalizedName;
    if (normalizedEmail !== original.institutional_email) payload.institutional_email = normalizedEmail;
    if (draft.id_role !== original.id_role) payload.id_role = draft.id_role;

    if (Object.keys(payload).length === 0) {
      toast.message('No changes to save');
      return;
    }

    setSavingUserId(userId);
    try {
      const updated = await apiService.updateUser(userId, payload);
      setUsers((prev) =>
        prev.map((user) => (user.id_user === userId ? updated : user)),
      );
      setUserDrafts((prev) => ({
        ...prev,
        [userId]: {
          full_name: updated.full_name,
          institutional_email: updated.institutional_email,
          id_role: updated.id_role,
        },
      }));
      toast.success('User updated successfully');
    } catch (error) {
      toast.error((error as Error).message || 'Could not update user');
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="group flex items-center transition-all duration-300 overflow-hidden"
      >
        <Users className="w-4 h-4" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out group-hover:max-w-xs group-hover:ml-2">
          Users
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[96vw] max-w-[96vw] lg:max-w-375 max-h-[92vh] overflow-hidden p-0">
          <DialogHeader>
            <div className="px-6 pt-6 pb-3 border-b bg-gradient-to-r from-background/80 to-card/80">
              <DialogTitle className="text-xl">User Management</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  View account data and update user roles (admins only)
                </p>
            </div>
          </DialogHeader>

          <div className="space-y-4 px-4 sm:px-6 pb-6 bg-muted/60">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by name, email, role, failed attempts or recovery code"
                      className="pl-9"
                    />
                  </div>

              <Button variant="outline" onClick={handleCopyVisibleRows} className="w-full lg:w-auto">
                <Copy className="w-4 h-4" />
                Copy visible table
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border bg-card px-4 py-3 shadow-sm">
                <p className="text-xs text-muted-foreground">Total Users</p>
                <p className="text-xl font-semibold text-foreground">{filteredUsers.length}</p>
              </div>
              <div className="rounded-lg border bg-card px-4 py-3 shadow-sm">
                <p className="text-xs text-muted-foreground">Blocked Users</p>
                <p className="text-xl font-semibold text-foreground">
                  {filteredUsers.filter((user) => getAccountStatus(user.locked_until).blocked).length}
                </p>
              </div>
              <div className="rounded-lg border bg-card px-4 py-3 shadow-sm">
                <p className="text-xs text-muted-foreground">Failed Attempts (Total)</p>
                <p className="text-xl font-semibold text-foreground">
                  {filteredUsers.reduce((acc, user) => acc + (user.failed_login_attempts ?? 0), 0)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border shadow-sm bg-card">
              <div className="overflow-x-auto overflow-y-auto max-h-[58vh]">
                <table className="w-full min-w-250 text-foreground text-xs sm:text-sm">
                  <thead className="bg-muted text-foreground font-semibold text-left sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2">Full Name</th>
                      <th className="px-2 py-2">Institutional Email</th>
                      <th className="px-2 py-2">Current Role</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Recovery Code</th>
                      <th className="px-2 py-2">Code Expiration</th>
                      <th className="px-2 py-2">Failed Attempts</th>
                      <th className="px-2 py-2">Last Failed Login</th>
                      <th className="px-2 py-2">Locked Until</th>
                      <th className="px-2 py-2">Actions</th>
                    </tr>
                  </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-2 py-6 text-center text-gray-500">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-2 py-6 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => {
                      const status = getAccountStatus(user.locked_until);
                      const draft = userDrafts[user.id_user] ?? {
                        full_name: user.full_name,
                        institutional_email: user.institutional_email,
                        id_role: user.id_role,
                      };
                      const hasPendingChanges =
                        draft.full_name.trim() !== user.full_name ||
                        draft.institutional_email.trim() !== user.institutional_email ||
                        draft.id_role !== user.id_role;
                      return (
                      <tr
                        key={user.id_user}
                        className={`border-t ${
status.blocked
                          ? 'bg-red-50/40'
                          : index % 2 === 0
                          ? 'bg-background'
                          : 'bg-muted/50'
                      }`}
                      >
                        <td className="px-2 py-1.5 align-top">
                          <Input
                            value={draft.full_name}
                            onChange={(event) => handleDraftChange(user.id_user, 'full_name', event.target.value)}
                            disabled={!canEditRoles || savingUserId === user.id_user}
                            className="h-8"
                          />
                        </td>
                        <td className="px-2 py-1.5 align-top max-w-52">
                          <Input
                            value={draft.institutional_email}
                            onChange={(event) => handleDraftChange(user.id_user, 'institutional_email', event.target.value)}
                            disabled={!canEditRoles || savingUserId === user.id_user}
                            className="h-8"
                          />
                        </td>
                        <td className="px-2 py-1.5 align-top">
                          <Select
                            value={String(draft.id_role)}
                            onValueChange={(value) => handleRoleChange(user.id_user, Number(value))}
                            disabled={!canEditRoles || savingUserId === user.id_user}
                          >
                            <SelectTrigger
                              className="w-36"
                              title={!canEditRoles ? 'Only administrators can edit role' : 'Change user role'}
                            >
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map((role) => (
                                <SelectItem key={role.value} value={String(role.value)}>
                                  {role.label}
                                </SelectItem>
                              ))}
                              {!ROLE_OPTIONS.some((role) => role.value === draft.id_role) && (
                                <SelectItem value={String(draft.id_role)}>{getRoleLabel(draft.id_role)}</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-1.5 align-top">
                          {status.blocked ? (
                            <Badge className="bg-red-100 text-red-700 border-red-200">
                              <ShieldAlert className="w-3 h-3" />
                              Blocked
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              <ShieldCheck className="w-3 h-3" />
                              Active
                            </Badge>
                          )}
                        </td>
                        <td className="px-2 py-1.5 align-top max-w-28">
                          <button
                            type="button"
                            onClick={() => copyText(user.recovery_code ?? '-', 'Recovery code copied')}
                            className="text-left w-full hover:underline break-all leading-tight"
                            title="Click to copy"
                          >
                            {user.recovery_code || '-'}
                          </button>
                        </td>
                        <td className="px-2 py-1.5 align-top whitespace-nowrap">{formatBogotaDateTime(user.recovery_code_expiration)}</td>
                        <td className="px-2 py-1.5 align-top font-semibold text-center">{user.failed_login_attempts ?? 0}</td>
                        <td className="px-2 py-1.5 align-top whitespace-nowrap">{formatBogotaDateTime(user.last_failed_login)}</td>
                        <td className="px-2 py-1.5 align-top whitespace-nowrap">{formatBogotaDateTime(user.locked_until)}</td>
                        <td className="px-2 py-1.5 align-top">
                          <Button
                            type="button"
                            size="sm"
                            variant={hasPendingChanges ? 'default' : 'outline'}
                            disabled={!canEditRoles || !hasPendingChanges || savingUserId === user.id_user}
                            onClick={() => handleSaveUserChanges(user.id_user)}
                          >
                            {savingUserId === user.id_user ? 'Saving...' : 'Save'}
                          </Button>
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
