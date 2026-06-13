"use client";

import { createAuthClient } from "better-auth/react";
import { useState, useEffect, useCallback } from "react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
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
  const [data, setData] = useState<SessionData | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await authClient.getSession();
      if (res.data?.user) {
        setData(res.data as unknown as SessionData);
      } else {
        setData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch session"));
      setData(null);
    } finally {
      setIsPending(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return { data, isPending, error };
}
