"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface WishlistContextValue {
  wishlistIds: Set<string>;
  loading: boolean;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth status without hooks
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.get<{ user?: { id: string } }>("/api/auth/get-session");
        if (res.success && res.data?.user) {
          setIsAuthenticated(true);
        }
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

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

  const isInWishlist = useCallback(
    (productId: string) => wishlistIds.has(productId),
    [wishlistIds]
  );

  return (
    <WishlistContext.Provider value={{ wishlistIds, loading, fetchWishlist, toggleWishlist, isInWishlist }}>
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
