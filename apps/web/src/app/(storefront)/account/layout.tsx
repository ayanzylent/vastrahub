"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { AccountNav } from "@/components/account/account-nav";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: sessionData, isPending } = useSession();
  const user = sessionData?.user;
  const router = useRouter();
  const pathname = usePathname();

  // Gate unauthenticated users — send them to login and back here after.
  useEffect(() => {
    if (!isPending && !user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isPending, user, pathname, router]);

  if (isPending || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        <Skeleton className="h-9 w-48" />
        <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="font-heading text-2xl font-bold md:text-3xl">My Account</h1>
      <p className="mt-1 text-sm text-muted-foreground md:text-base">
        Manage your profile, orders, addresses, and security settings.
      </p>

      <div className="mt-6 grid gap-4 md:mt-8 md:grid-cols-[220px_1fr] md:gap-8">
        {/* Left nav */}
        <aside className="min-w-0 md:sticky md:top-24 md:self-start">
          <div className="rounded-xl border bg-card p-2">
            <AccountNav />
          </div>
        </aside>

        {/* Content pane */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
