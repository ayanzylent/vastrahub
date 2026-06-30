'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from '@/lib/auth-client';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Search,
  ShieldAlert,
  Users,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Crown,
  Shield,
  User as UserIcon,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
  createdAt: string;
}

interface RoleChangeTarget {
  user: AdminUser;
  newRole: string;
}

const ROLES = ['customer', 'admin', 'superadmin'] as const;

function getRoleBadge(role: string) {
  switch (role) {
    case 'superadmin':
      return (
        <Badge className="border-transparent bg-primary/10 text-primary">
          <Crown className="mr-1 h-3 w-3" />
          Super Admin
        </Badge>
      );
    case 'admin':
      return (
        <Badge className="border-transparent bg-blue-500/10 text-blue-400">
          <Shield className="mr-1 h-3 w-3" />
          Admin
        </Badge>
      );
    default:
      return (
        <Badge className="border-transparent bg-zinc-500/10 text-zinc-400">
          <UserIcon className="mr-1 h-3 w-3" />
          Customer
        </Badge>
      );
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'superadmin':
      return 'Super Admin';
    case 'admin':
      return 'Admin';
    default:
      return 'Customer';
  }
}

export default function AdminUsersPage() {
  const { data: sessionData } = useSession();
  const user = sessionData?.user;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleChangeTarget, setRoleChangeTarget] = useState<RoleChangeTarget | null>(null);
  const [changingRole, setChangingRole] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      
      const res = await api.paginated<AdminUser>(
        `/api/v1/admin/users?${params.toString()}`
      );

      if (res.success) {
        setUsers(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotal(res.pagination.total);
      } else {
        toast.error('Failed to load users');
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (user?.role === 'superadmin') {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  // Debounced search
  useEffect(() => {
    setPage(1);
  }, [search]);

  async function handleRoleChange() {
    if (!roleChangeTarget) return;

    setChangingRole(true);
    try {
      const res = await api.put(`/api/v1/admin/users/${roleChangeTarget.user.id}/role`, {
        role: roleChangeTarget.newRole,
      });

      if (res.success) {
        toast.success(
          `Role updated: ${roleChangeTarget.user.name} is now ${getRoleLabel(roleChangeTarget.newRole)}`
        );
        fetchUsers();
      } else {
        toast.error(res.error || 'Failed to update role');
      }
    } catch {
      toast.error('Failed to update role');
    } finally {
      setChangingRole(false);
      setRoleChangeTarget(null);
    }
  }

  // Superadmin access check
  if (user?.role !== 'superadmin') {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <ShieldAlert className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Superadmin Access Required</h1>
          <p className="text-muted-foreground">
            Only Super Admins can manage user roles and permissions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">User Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage user roles and permissions &middot; {total} users total
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="user-search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-card/60 backdrop-blur-md overflow-hidden rounded-xl border border-border/40">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-32" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-44" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-8 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === user?.id;
                  const isSuperadmin = u.role === 'superadmin';
                  const canChangeRole = !isSelf && !isSuperadmin;

                  return (
                    <tr
                      key={u.id}
                      className="transition-colors duration-150 hover:bg-muted/20"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-foreground">
                            {u.name}
                            {isSelf && (
                              <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {u.email}
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(u.role)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canChangeRole ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {ROLES.filter((r) => r !== u.role && r !== 'superadmin').map((role) => (
                                <DropdownMenuItem
                                  key={role}
                                  onClick={() => setRoleChangeTarget({ user: u, newRole: role })}
                                >
                                  <span className={cn(
                                    'mr-2 h-2 w-2 rounded-full',
                                    role === 'admin' ? 'bg-blue-400' : 'bg-zinc-400'
                                  )} />
                                  {getRoleLabel(role)}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {isSelf ? 'Current user' : 'Protected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/40 px-6 py-3">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Role Change Confirmation Dialog */}
      <Dialog open={!!roleChangeTarget} onOpenChange={() => setRoleChangeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Role Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change{' '}
              <span className="font-semibold text-foreground">
                {roleChangeTarget?.user.name}
              </span>
              &apos;s role from{' '}
              <span className="font-semibold">{getRoleLabel(roleChangeTarget?.user.role || '')}</span>{' '}
              to{' '}
              <span className="font-semibold">{getRoleLabel(roleChangeTarget?.newRole || '')}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleChangeTarget(null)}
              disabled={changingRole}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleRoleChange}
              disabled={changingRole}
            >
              {changingRole ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm Change'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
