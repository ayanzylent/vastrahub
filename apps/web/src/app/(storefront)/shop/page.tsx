"use client";

import Link from "next/link";
import { Suspense, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ProductListing,
  DEFAULT_SORT_OPTIONS,
} from "@/components/storefront/catalog/product-listing";
import {
  useProductListing,
  type ListingFetchContext,
  type ProductWithSkus,
} from "@/hooks/use-product-listing";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "@/types";

function ShopContent() {
  const fetchPage = useCallback(async (ctx: ListingFetchContext) => {
    const res = await api.get<PaginatedResponse<ProductWithSkus>>(
      `/api/v1/storefront/products?${ctx.params.toString()}`,
    );
    const data = res as unknown as PaginatedResponse<ProductWithSkus>;
    if (data.success && data.data) {
      return {
        products: data.data,
        totalPages: data.pagination?.totalPages ?? 1,
        total: data.pagination?.total ?? 0,
      };
    }
    return { products: [], totalPages: 1, total: 0 };
  }, []);

  const listing = useProductListing({
    defaultSort: "newest",
    includeSearch: true,
    fetchPage,
  });

  return (
    <ProductListing
      listing={listing}
      sortOptions={DEFAULT_SORT_OPTIONS}
      breadcrumb={
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <span className="text-foreground">Shop</span>
        </nav>
      }
      header={
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold">
            {listing.search ? `Search Results for "${listing.search}"` : "Shop All"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {listing.search
              ? `Showing products matching "${listing.search}"`
              : "Browse our full catalog of handcrafted sarees, premium designer wear, and exclusive heritage collections."}
          </p>
        </div>
      }
    />
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-12">
          <div className="space-y-4 max-w-lg mx-auto py-20 text-center">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden opacity-50">
                  <CardContent className="p-0">
                    <Skeleton className="aspect-[3/4] w-full rounded-none" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
