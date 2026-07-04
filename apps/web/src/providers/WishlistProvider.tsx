"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

interface WishlistContextValue {
  wishlistIds: Set<string>;
  loading: boolean;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

interface WishlistItem {
  _id: string;
  productId: string;
}

interface WishlistResponse {
  items?: WishlistItem[];
  productIds?: string[];
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Source auth state from the shared Better-Auth session hook (same mechanism the
  // header uses). The raw /api/auth/get-session response is the session object itself
  // ({ user, session }), NOT the app's { success, data } envelope — so parsing it as
  // an ApiResponse always failed and left the user perpetually "logged out" here.
  const { data: sessionData } = useSession();
  const isAuthenticated = !!sessionData?.user;

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.get<WishlistResponse>("/api/v1/user/wishlist");
      if (res.success && res.data) {
        if (res.data.productIds) {
          setWishlistIds(new Set(res.data.productIds));
        } else if (res.data.items) {
          setWishlistIds(new Set(res.data.items.map((i) => i.productId)));
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, fetchWishlist]);

  const toggleWishlist = useCallback(async (productId: string) => {
    if (!isAuthenticated) {
      toast.error("Please login to save to wishlist");
      return;
    }

    const isInList = wishlistIds.has(productId);
    try {
      if (isInList) {
        const res = await api.delete(`/api/v1/user/wishlist/${productId}`);
        if (res.success) {
          setWishlistIds((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
          toast.success("Removed from wishlist");
        }
      } else {
        const res = await api.post(`/api/v1/user/wishlist/${productId}`);
        if (res.success) {
          setWishlistIds((prev) => new Set(prev).add(productId));
          toast.success("Added to wishlist");
        }
      }
    } catch {
      toast.error("Failed to update wishlist");
    }
  }, [isAuthenticated, wishlistIds]);

  /**
   * Remove a product from the wishlist unconditionally (does not depend on the
   * locally-cached membership set being loaded). Keeps global wishlist state in
   * sync so hearts elsewhere reflect the removal immediately.
   */
  const removeFromWishlist = useCallback(async (productId: string): Promise<boolean> => {
    const res = await api.delete(`/api/v1/user/wishlist/${productId}`);
    if (res.success) {
      setWishlistIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      return true;
    }
    return false;
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => wishlistIds.has(productId),
    [wishlistIds]
  );

  return (
    <WishlistContext.Provider
      value={{ wishlistIds, loading, fetchWishlist, toggleWishlist, removeFromWishlist, isInWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
