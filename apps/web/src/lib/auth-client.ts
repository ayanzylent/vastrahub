"use client";

import { createAuthClient } from "better-auth/react";
import { useState, useEffect, useCallback } from "react";

/**
 * When API proxy is enabled (NEXT_PUBLIC_API_PROXY="true"), all /api requests
 * are rewritten by Next.js to the backend. Using same-origin (empty baseURL)
 * makes cookies first-party — fixing mobile Safari / ITP cookie blocking.
 *
 * When proxy is off (custom domains or local dev), use the direct backend URL.
 */
const useApiProxy = process.env.NEXT_PUBLIC_API_PROXY === "true";

export const authClient = createAuthClient({
  baseURL: useApiProxy ? "" : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"),
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, signOut } = authClient;

/**
 * Extended user type that includes the custom 'role' field
 * configured as additionalFields on the Better-Auth server.
 */
export interface UserWithRole {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionData {
  user: UserWithRole;
  session: { id: string; token: string; expiresAt: Date };
}

/**
 * SSR-safe wrapper around Better-Auth's session.
 * Fetches session via the auth client API on mount (client-side only),
 * avoiding the useRef crash during Next.js static prerendering.
 */
export function useSession(): {
  data: SessionData | null;
  isPending: boolean;
  error: Error | null;
} {
  const [session, setSession] = useState<{
    data: SessionData | null;
    isPending: boolean;
    error: Error | null;
  }>({
    data: null,
    isPending: true,
    error: null,
  });

  useEffect(() => {
    // Subscribe to the session atom (client-side only) to reactively
    // update session state whenever sign-in, sign-out, or user edits occur.
    const unsubscribe = authClient.$store.atoms.session.subscribe((val) => {
      setSession({
        data: val.data as unknown as SessionData,
        isPending: val.isPending,
        error: val.error,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return session;
}

