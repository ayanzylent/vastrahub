"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import {
  getServerApiBase,
  STOREFRONT_HERO_TAG,
  STOREFRONT_SITE_SETTINGS_TAG,
} from "@/lib/server-api";

export type RevalidateHomeResult = {
  ok: boolean;
  reason?: "auth_check_failed" | "insufficient_role" | "auth_unreachable";
};

/**
 * On-demand revalidation of the home page (`/`), called after an admin saves
 * site settings so hero edits appear immediately. Verifies the caller is a
 * superadmin via the backend session before busting the cache (the action
 * endpoint is otherwise publicly invocable).
 */
export async function revalidateHome(): Promise<RevalidateHomeResult> {
  const base = await getServerApiBase();
  const cookieHeader = (await cookies()).toString();

  try {
    const res = await fetch(`${base}/api/v1/auth/me`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, reason: "auth_check_failed" };
    const json = (await res.json()) as { data?: { role?: string } };
    const role = json.data?.role;
    if (role !== "superadmin") return { ok: false, reason: "insufficient_role" };
  } catch {
    return { ok: false, reason: "auth_unreachable" };
  }

  revalidateTag(STOREFRONT_HERO_TAG);
  revalidateTag(STOREFRONT_SITE_SETTINGS_TAG);
  revalidatePath("/");
  return { ok: true };
}
