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
        className="group flex items-center transition-all duration-300 overflow-hidden border-teal-500/30 text-teal-400 bg-gray-900/40 hover:bg-teal-500/10 hover:text-teal-300 hover:border-teal-500/50 shadow-sm"
      >
        <Users className="w-4 h-4" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out group-hover:max-w-xs group-hover:ml-2">
          Users
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[96vw] max-w-[96vw] lg:max-w-375 max-h-[92vh] overflow-hidden p-0 border-gray-700/50 bg-gray-900/95 shadow-2xl backdrop-blur-md text-gray-200">
          <DialogHeader>
            <div className="px-6 pt-6 pb-4 border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">User Management</DialogTitle>
                <p className="text-sm text-gray-400 mt-1">
                  View account data and update user roles (admins only)
                </p>
            </div>
          </DialogHeader>

          <div className="space-y-5 px-4 sm:px-6 pb-6 pt-4 bg-gray-900/30">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by name, email, role, failed attempts or recovery code"
                      className="pl-9 bg-gray-800/80 border-gray-700 text-gray-200 placeholder:text-gray-500 focus-visible:ring-teal-500 focus-visible:border-teal-500"
                    />
                  </div>

              <Button variant="outline" onClick={handleCopyVisibleRows} className="w-full lg:w-auto border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors">
                <Copy className="w-4 h-4 mr-2" />
                Copy visible table
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 px-5 py-4 shadow-sm backdrop-blur-sm">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Total Users</p>
                <p className="text-2xl font-bold text-gray-100">{filteredUsers.length}</p>
              </div>
              <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 px-5 py-4 shadow-sm backdrop-blur-sm">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Blocked Users</p>
                <p className="text-2xl font-bold text-gray-100">
                  {filteredUsers.filter((user) => getAccountStatus(user.locked_until).blocked).length}
                </p>
              </div>
              <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 px-5 py-4 shadow-sm backdrop-blur-sm">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Failed Attempts (Total)</p>
                <p className="text-2xl font-bold text-gray-100">
                  {filteredUsers.reduce((acc, user) => acc + (user.failed_login_attempts ?? 0), 0)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-700/50 shadow-xl bg-gray-800/30 backdrop-blur-sm overflow-hidden">
              <div className="overflow-x-auto overflow-y-auto max-h-[58vh]">
                <table className="w-full min-w-250 text-gray-200 text-xs sm:text-sm border-collapse">
                  <thead className="bg-gray-800/80 text-gray-300 font-semibold text-left sticky top-0 z-10 backdrop-blur-md shadow-sm">
                    <tr>
                      <th className="px-3 py-3 tracking-wide">Full Name</th>
                      <th className="px-3 py-3 tracking-wide">Institutional Email</th>
                      <th className="px-3 py-3 tracking-wide">Current Role</th>
                      <th className="px-3 py-3 tracking-wide">Status</th>
                      <th className="px-3 py-3 tracking-wide">Recovery Code</th>
                      <th className="px-3 py-3 tracking-wide">Code Expiration</th>
                      <th className="px-3 py-3 tracking-wide">Failed Attempts</th>
                      <th className="px-3 py-3 tracking-wide">Last Failed Login</th>
                      <th className="px-3 py-3 tracking-wide">Locked Until</th>
                      <th className="px-3 py-3 tracking-wide text-center">Actions</th>
                    </tr>
                  </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-3 py-8 text-center text-gray-500">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-3 py-8 text-center text-gray-500">
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
                        className={`border-t border-gray-700/50 transition-colors hover:bg-gray-700/30 ${
                          status.blocked
                            ? 'bg-red-900/10'
                            : index % 2 === 0
                            ? 'bg-transparent'
                            : 'bg-gray-800/20'
                        }`}
                      >
                        <td className="px-3 py-2 align-middle">
                          <Input
                            value={draft.full_name}
                            onChange={(event) => handleDraftChange(user.id_user, 'full_name', event.target.value)}
                            disabled={!canEditRoles || savingUserId === user.id_user}
                            className="h-11 rounded-xl !bg-gray-800 !border-gray-600 !text-gray-100 placeholder:!text-gray-500 shadow-none focus-visible:ring-teal-500"
                          />
                        </td>
                        <td className="px-3 py-2 align-middle max-w-52">
                          <Input
                            value={draft.institutional_email}
                            onChange={(event) => handleDraftChange(user.id_user, 'institutional_email', event.target.value)}
                            disabled={!canEditRoles || savingUserId === user.id_user}
                            className="h-11 rounded-xl !bg-gray-800 !border-gray-600 !text-gray-100 placeholder:!text-gray-500 shadow-none focus-visible:ring-teal-500"
                          />
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <Select
                            value={String(draft.id_role)}
                            onValueChange={(value) => handleRoleChange(user.id_user, Number(value))}
                            disabled={!canEditRoles || savingUserId === user.id_user}
                          >
                            <SelectTrigger
                              className="w-36 h-9 bg-gray-800/60 border-gray-600 text-gray-200 focus:ring-teal-500"
                              title={!canEditRoles ? 'Only administrators can edit role' : 'Change user role'}
                            >
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
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
                        <td className="px-3 py-2 align-middle">
                          {status.blocked ? (
                            <Badge className="bg-red-500/10 text-red-400 border-red-500/20 px-2 py-0.5 font-medium whitespace-nowrap">
                              <ShieldAlert className="w-3.5 h-3.5 mr-1 inline" />
                              Blocked
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2 py-0.5 font-medium whitespace-nowrap">
                              <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" />
                              Active
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 align-middle max-w-28 text-center">
                          <button
                            type="button"
                            onClick={() => copyText(user.recovery_code ?? '-', 'Recovery code copied')}
                            className="text-left w-full hover:text-teal-400 hover:underline break-all leading-tight text-gray-300 transition-colors"
                            title="Click to copy"
                          >
                            {user.recovery_code || '-'}
                          </button>
                        </td>
                        <td className="px-3 py-2 align-middle whitespace-nowrap text-gray-400">{formatBogotaDateTime(user.recovery_code_expiration)}</td>
                        <td className="px-3 py-2 align-middle font-medium text-center text-gray-300">{user.failed_login_attempts ?? 0}</td>
                        <td className="px-3 py-2 align-middle whitespace-nowrap text-gray-400">{formatBogotaDateTime(user.last_failed_login)}</td>
                        <td className="px-3 py-2 align-middle whitespace-nowrap text-gray-400">{formatBogotaDateTime(user.locked_until)}</td>
                        <td className="px-3 py-2 align-middle">
                          <Button
                            type="button"
                            size="sm"
                            className={
                              hasPendingChanges
                                ? 'bg-teal-600 text-white hover:bg-teal-700 border-none w-full'
                                : 'border-gray-600 text-gray-400 hover:text-gray-200 hover:bg-gray-700 w-full'
                            }
                            variant={hasPendingChanges ? 'default' : 'default'}
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
