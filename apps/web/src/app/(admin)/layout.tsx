import { cookies } from "next/headers";
import { AdminLayoutClient } from "@/components/layout/admin-layout-client";

/**
 * Force dynamic rendering for all admin pages.
 * Admin pages require authentication and should never be statically prerendered.
 */
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Restore the sidebar open/collapsed state from the cookie set by SidebarProvider.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <AdminLayoutClient defaultOpen={defaultOpen}>{children}</AdminLayoutClient>
  );
}
