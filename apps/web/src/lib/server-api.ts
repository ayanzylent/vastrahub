import { headers } from "next/headers";

/** On-demand cache bust for homepage hero JSON (`getHero`). */
export const STOREFRONT_HERO_TAG = "storefront-hero";

/** On-demand cache bust for homepage blocks (`fetchStorefrontSiteSettings`). */
export const STOREFRONT_SITE_SETTINGS_TAG = "storefront-site-settings";

const useApiProxy = process.env.NEXT_PUBLIC_API_PROXY === "true";

/**
 * Base URL for server-side API calls (Server Components, Server Actions).
 * When the browser uses the Next.js `/api` proxy, server code must use the same
 * origin so session cookies validate correctly on Vercel.
 */
export async function getServerApiBase(): Promise<string> {
  if (!useApiProxy) {
    return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  }

  const h = await headers();
  const host = h.get("host");
  if (!host) {
    return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  }

  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
