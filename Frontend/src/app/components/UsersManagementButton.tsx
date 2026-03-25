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

  const loadUsers = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const list = await apiService.getUsers();
      setUsers(list);
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

  const handleRoleChange = async (userId: number, nextRoleId: number) => {
    if (!canEditRoles) {
      toast.error('Only administrators can change roles');
      return;
    }

    const selectedUser = users.find((user) => user.id_user === userId);
    if (!selectedUser || selectedUser.id_role === nextRoleId) return;

    setSavingUserId(userId);
    try {
      await apiService.updateUserRole(userId, nextRoleId);
      setUsers((prev) =>
        prev.map((user) =>
          user.id_user === userId ? { ...user, id_role: nextRoleId } : user,
        ),
      );
      toast.success('Role updated successfully');
    } catch (error) {
      toast.error((error as Error).message || 'Could not update role');
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
                    </tr>
                  </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-2 py-6 text-center text-gray-500">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-2 py-6 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => {
                      const status = getAccountStatus(user.locked_until);
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
                          <button
                            type="button"
                            onClick={() => copyText(user.full_name, 'Name copied')}
                            className="text-left w-full hover:underline font-medium leading-tight"
                            title="Click to copy"
                          >
                            {user.full_name}
                          </button>
                        </td>
                        <td className="px-2 py-1.5 align-top max-w-52">
                          <button
                            type="button"
                            onClick={() => copyText(user.institutional_email, 'Email copied')}
                            className="text-left w-full hover:underline break-all leading-tight"
                            title="Click to copy"
                          >
                            {user.institutional_email}
                          </button>
                        </td>
                        <td className="px-2 py-1.5 align-top">
                          <Select
                            value={String(user.id_role)}
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
                              {!ROLE_OPTIONS.some((role) => role.value === user.id_role) && (
                                <SelectItem value={String(user.id_role)}>{getRoleLabel(user.id_role)}</SelectItem>
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
