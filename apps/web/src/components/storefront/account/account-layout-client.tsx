"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";

export function AccountLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: sessionData, isPending } = useSession();
  const user = sessionData?.user;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isPending && !user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isPending, user, pathname, router]);

  if (isPending || !user) {
    return (
      <div className="mx-auto max-w-4xl px-4 md:px-6 py-8">
        <Skeleton className="h-9 w-48" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
      <div className="min-w-0">{children}</div>
    </div>
  );
}
