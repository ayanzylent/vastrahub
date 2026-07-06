"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

/**
 * On-demand ISR revalidation of the home page (`/`), called after an admin saves
 * site settings so hero edits appear immediately instead of waiting for the ISR
 * window. Verifies the caller is an admin via the backend session before busting
 * the cache (the action endpoint is otherwise publicly invocable).
 */
export async function revalidateHome(): Promise<{ ok: boolean }> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieHeader = (await cookies()).toString();

  try {
    const res = await fetch(`${base}/api/v1/auth/me`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false };
    const json = (await res.json()) as { data?: { role?: string } };
    const role = json.data?.role;
    if (role !== "superadmin") return { ok: false };
  } catch {
    return { ok: false };
  }

  revalidatePath("/");
  return { ok: true };
}
