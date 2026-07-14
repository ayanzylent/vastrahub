'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { AdminSidebar } from '@/components/admin/layout/admin-sidebar';
import { AdminTopbar } from '@/components/admin/layout/admin-topbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function AdminLayoutClient({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const { data: sessionData, isPending } = useSession();
  const user = sessionData?.user;
  const router = useRouter();
  const pathname = usePathname();

  // Redirect unauthenticated users to admin login
  useEffect(() => {
    if (!isPending && !user) {
      const loginUrl = `/admin/login?callbackUrl=${encodeURIComponent(pathname)}`;
      router.replace(loginUrl);
    }
  }, [isPending, user, pathname, router]);

  if (isPending || (!isPending && !user)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-40 mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don&apos;t have permission to access the admin panel.
            Admin or Super Admin privileges are required.
          </p>
          <Button variant="default" asChild>
            <Link href="/">Back to Store</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AdminSidebar />
      <SidebarInset className="min-w-0">
        <AdminTopbar />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
