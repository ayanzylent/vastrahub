import { AdminLayoutClient } from "@/components/layout/admin-layout-client";

/**
 * Force dynamic rendering for all admin pages.
 * Admin pages require authentication and should never be statically prerendered.
 */
export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
