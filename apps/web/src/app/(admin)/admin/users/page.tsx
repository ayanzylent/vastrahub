'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { toast } from 'sonner';
import {
  Search,
  ShieldAlert,
  Shield,
  ChevronLeft,
  ChevronRight,
  Crown,
  UserPlus,
  UserMinus,
  Loader2,
  User as UserIcon,
  Mail,
} from 'lucide-react';

// ---------- Types ----------

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
  createdAt: string;
}

interface CustomerResult {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

// ---------- Helpers ----------

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

// ---------- Page Component ----------

export default function AdminUsersPage() {
  const { data: sessionData } = useSession();
  const user = sessionData?.user;
  const router = useRouter();

  useEffect(() => {
    if (sessionData && user?.role === 'admin') {
      router.replace('/admin/dashboard');
    }
  }, [sessionData, user?.role, router]);

  // Admin list state
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Revoke dialog state
  const [revokeTarget, setRevokeTarget] = useState<AdminUser | null>(null);
  const [revoking, setRevoking] = useState(false);

  // Add admin dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState<CustomerResult | null>(null);
  const [promoting, setPromoting] = useState(false);

  // ---------- Fetch admins ----------

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);

      const res = await api.paginated<AdminUser>(
        `/api/v1/admin/users?${params.toString()}`
      );

      if (res.success) {
        setAdmins(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotal(res.pagination.total);
      } else {
        toast.error('Failed to load admins');
      }
    } catch {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (user?.role === 'superadmin') {
      fetchAdmins();
    }
  }, [user, fetchAdmins]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  // ---------- Search customers ----------

  const handleCustomerSearch = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setCustomerResults([]);
      return;
    }

    setSearchingCustomers(true);
    try {
      const res = await api.get<CustomerResult[]>(
        `/api/v1/admin/users/search-customers?search=${encodeURIComponent(term.trim())}`
      );

      if (res.success) {
        setCustomerResults(res.data ?? []);
      }
    } catch {
      // Silently handle search errors
    } finally {
      setSearchingCustomers(false);
    }
  }, []);

  // Debounce customer search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (addDialogOpen) {
        handleCustomerSearch(customerSearch);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [customerSearch, addDialogOpen, handleCustomerSearch]);

  // ---------- Promote to admin ----------

  async function handlePromote() {
    if (!promoteTarget) return;

    setPromoting(true);
    try {
      const res = await api.post('/api/v1/admin/users/promote', {
        email: promoteTarget.email,
      });

      if (res.success) {
        toast.success(`${promoteTarget.name} has been promoted to Admin`);
        setPromoteTarget(null);
        setAddDialogOpen(false);
        setCustomerSearch('');
        setCustomerResults([]);
        fetchAdmins();
      } else {
        toast.error(res.error || 'Failed to promote user');
      }
    } catch {
      toast.error('Failed to promote user');
    } finally {
      setPromoting(false);
    }
  }

  // ---------- Revoke admin ----------

  async function handleRevoke() {
    if (!revokeTarget) return;

    setRevoking(true);
    try {
      const res = await api.put(`/api/v1/admin/users/${revokeTarget.id}/revoke`);

      if (res.success) {
        toast.success(`Admin access revoked for ${revokeTarget.name}`);
        setRevokeTarget(null);
        fetchAdmins();
      } else {
        toast.error(res.error || 'Failed to revoke access');
      }
    } catch {
      toast.error('Failed to revoke access');
    } finally {
      setRevoking(false);
    }
  }

  // ---------- Access guard ----------

  if (user?.role !== 'superadmin') {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <ShieldAlert className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Special Permissions Required</h1>
          <p className="text-muted-foreground">
            You do not have the required permissions to access this page.
          </p>
        </div>
      </div>
    );
  }

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">Admin Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage admin access &middot; {total} admin{total !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>
        <Button
          id="add-admin-btn"
          onClick={() => setAddDialogOpen(true)}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Add Admin
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="admin-search"
          placeholder="Search admins by name or email..."
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
                  Added
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
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-44" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No admins found
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const isSelf = admin.id === user?.id;
                  const isSuperadmin = admin.role === 'superadmin';
                  const canRevoke = !isSelf && !isSuperadmin;

                  return (
                    <tr
                      key={admin.id}
                      className="transition-colors duration-150 hover:bg-muted/20"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {admin.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-foreground">
                            {admin.name}
                            {isSelf && (
                              <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {admin.email}
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(admin.role)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(admin.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canRevoke ? (
                          <Button
                            id={`revoke-btn-${admin.id}`}
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => setRevokeTarget(admin)}
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                            Revoke
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {isSelf ? 'You' : 'Protected'}
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

      {/* ---------- Revoke Confirmation Dialog ---------- */}
      <Dialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Admin Access</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Are you sure you want to revoke admin access for{' '}
                  <span className="font-semibold text-foreground">{revokeTarget?.name}</span>?
                </p>
                <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3 text-sm text-red-400">
                  <p className="font-medium">This will:</p>
                  <ul className="mt-1 list-disc list-inside space-y-0.5">
                    <li>Demote the user to &quot;Customer&quot; role</li>
                    <li>Log them out of all active sessions immediately</li>
                    <li>Remove their access to the admin panel</li>
                  </ul>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeTarget(null)}
              disabled={revoking}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={revoking}
            >
              {revoking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                <>
                  <UserMinus className="mr-2 h-4 w-4" />
                  Revoke Access
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- Add Admin Dialog ---------- */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) {
            setCustomerSearch('');
            setCustomerResults([]);
            setPromoteTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Admin</DialogTitle>
            <DialogDescription>
              Search for a customer by name or email and promote them to admin.
            </DialogDescription>
          </DialogHeader>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="customer-search"
              placeholder="Search by email or name..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {searchingCustomers ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </div>
            ) : customerSearch.trim().length < 2 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            ) : customerResults.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No customers found matching &quot;{customerSearch}&quot;
              </div>
            ) : (
              customerResults.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/10 px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {customer.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{customer.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3 shrink-0" />
                        {customer.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-3 shrink-0 gap-1.5 text-blue-400 border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-300"
                    onClick={() => setPromoteTarget(customer)}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Make Admin
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------- Promote Confirmation Dialog ---------- */}
      <Dialog open={!!promoteTarget} onOpenChange={() => setPromoteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Promotion</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Promote{' '}
                  <span className="font-semibold text-foreground">{promoteTarget?.name}</span>{' '}
                  ({promoteTarget?.email}) to Admin?
                </p>
                <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3 text-sm text-blue-400">
                  <p>They will gain access to the admin panel and be able to manage products, orders, and more.</p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPromoteTarget(null)}
              disabled={promoting}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePromote}
              disabled={promoting}
              className="gap-2"
            >
              {promoting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Promoting...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Promote to Admin
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
