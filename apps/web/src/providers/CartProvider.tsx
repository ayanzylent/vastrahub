"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import type { ICart, ICartItem } from "@vastrahub/shared-types";
import { toast } from "sonner";
import { BRAND_CONFIG } from "@vastrahub/shared-constants";

interface CartContextValue {
  cart: ICart | null;
  loading: boolean;
  itemCount: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  fetchCart: () => Promise<void>;
  addItem: (skuId: string, quantity: number) => Promise<void>;
  updateItem: (skuId: string, quantity: number) => Promise<void>;
  removeItem: (skuId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  mergeCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<ICart | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ICart>("/api/v1/cart", { withGuestId: true });
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch {
      // silently fail for cart
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (skuId: string, quantity: number) => {
    try {
      const res = await api.post<ICart>("/api/v1/cart/items", { skuId, quantity }, { withGuestId: true });
      if (res.success && res.data) {
        setCart(res.data);
        setIsDrawerOpen(true);
        toast.success("Added to cart");
      } else {
        toast.error(res.error || "Failed to add item");
      }
    } catch {
      toast.error("Failed to add to cart");
    }
  }, []);

  const updateItem = useCallback(async (skuId: string, quantity: number) => {
    try {
      const res = await api.put<ICart>(`/api/v1/cart/items/${skuId}`, { quantity }, { withGuestId: true });
      if (res.success && res.data) {
        setCart(res.data);
      } else {
        toast.error(res.error || "Failed to update item");
      }
    } catch {
      toast.error("Failed to update cart");
    }
  }, []);

  const removeItem = useCallback(async (skuId: string) => {
    try {
      const res = await api.delete<ICart>(`/api/v1/cart/items/${skuId}`, { withGuestId: true });
      if (res.success && res.data) {
        setCart(res.data);
        toast.success("Item removed");
      }
    } catch {
      toast.error("Failed to remove item");
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      await api.delete<void>("/api/v1/cart", { withGuestId: true });
      setCart(null);
    } catch {
      toast.error("Failed to clear cart");
    }
  }, []);

  const mergeCart = useCallback(async () => {
    try {
      const guestId = typeof window !== "undefined" ? localStorage.getItem(BRAND_CONFIG.GUEST_ID_KEY) : null;
      if (!guestId) return;
      const res = await api.post<ICart>("/api/v1/cart/merge", { guestId });
      if (res.success && res.data) {
        setCart(res.data);
        localStorage.removeItem(BRAND_CONFIG.GUEST_ID_KEY);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const itemCount = cart?.items?.reduce((sum: number, item: ICartItem) => sum + item.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart, loading, itemCount,
        isDrawerOpen, openDrawer, closeDrawer,
        fetchCart, addItem, updateItem, removeItem, clearCart, mergeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
