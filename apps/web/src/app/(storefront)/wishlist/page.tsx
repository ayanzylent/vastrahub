"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard, type ProductCardProduct } from "@/components/shared/product-card";
import { useWishlist } from "@/providers/WishlistProvider";
import { api } from "@/lib/api";

interface WishlistProduct extends ProductCardProduct {
  skus?: Array<{ pricePaise: number; mrpPaise: number }>;
}

export default function WishlistPage() {
  const { wishlistIds, fetchWishlist } = useWishlist();
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.get<{ user?: { id: string } }>("/api/auth/get-session");
        setIsAuthenticated(!!(res.success && res.data?.user));
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, fetchWishlist]);

  useEffect(() => {
    async function fetchProducts() {
      if (wishlistIds.size === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const ids = Array.from(wishlistIds);
        const results: WishlistProduct[] = [];
        for (const id of ids.slice(0, 20)) {
          try {
            const res = await api.get<WishlistProduct>(`/api/v1/storefront/products/${id}`);
            if (res.success && res.data) {
              results.push(res.data);
            }
          } catch {
            // skip individual failures
          }
        }
        setProducts(results);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [wishlistIds]);

  if (isAuthenticated === null) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="aspect-[3/4] w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mx-auto">
          <Heart className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-6 font-heading text-2xl font-bold">Login to view your wishlist</h2>
        <p className="mt-2 text-muted-foreground">
          Save your favorite items and access them from anywhere.
        </p>
        <Button variant="default" size="lg" asChild className="mt-6">
          <Link href="/login">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="aspect-[3/4] w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      <h1 className="font-heading text-2xl md:text-3xl font-bold mb-8">
        My Wishlist ({wishlistIds.size})
      </h1>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mx-auto">
            <Heart className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-6 font-heading text-lg font-semibold">Your wishlist is empty</h3>
          <p className="mt-2 text-muted-foreground">
            Browse our collection and tap the heart to save items.
          </p>
          <Button variant="default" size="lg" asChild className="mt-6">
            <Link href="/">Explore Products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              lowestPricePaise={product.skus?.[0]?.pricePaise ?? product.basePricePaise}
              lowestMrpPaise={product.skus?.[0]?.mrpPaise ?? product.baseMrpPaise}
            />
          ))}
        </div>
      )}
    </div>
  );
}
