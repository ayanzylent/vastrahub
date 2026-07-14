"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { ICategory, PaginatedResponse } from "@/types";

export function CategoryPageClient({
  slug,
  initialCategory = null,
}: {
  slug: string;
  initialCategory?: ICategory | null;
}) {
  const [category, setCategory] = useState<ICategory | null>(initialCategory);
  const [notFound, setNotFound] = useState(false);

  const categoryName =
    category?.name ||
    slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const fetchPage = useCallback(
    async (ctx: ListingFetchContext) => {
      const qs = new URLSearchParams(ctx.params);
      if (slug) qs.set("categorySlug", slug);

      const res = await api.get<PaginatedResponse<ProductWithSkus>>(
        `/api/v1/storefront/products?${qs.toString()}`,
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
    },
    [slug],
  );

  const listing = useProductListing({
    defaultSort: "newest",
    fetchPage,
  });

  useEffect(() => {
    if (!slug) return;
    if (initialCategory?.slug === slug) {
      setCategory(initialCategory);
      setNotFound(false);
      return;
    }
    api
      .get<ICategory>(`/api/v1/storefront/categories/${slug}`)
      .then((res) => {
        if (res.success && res.data) {
          setCategory(res.data);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true));
  }, [slug, initialCategory]);

  const showNotFound = notFound && !listing.loading;

  return (
    <ProductListing
      listing={listing}
      sortOptions={DEFAULT_SORT_OPTIONS}
      hideGrid={showNotFound}
      breadcrumb={
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-foreground">Categories</Link>
          <span>/</span>
          <span className="text-foreground">{categoryName}</span>
        </nav>
      }
      notFoundContent={
        showNotFound ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold">Category not found</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              This category may have been removed or is no longer available.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/categories">Browse Categories</Link>
            </Button>
          </div>
        ) : null
      }
      header={
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold">{categoryName}</h1>
          {category?.description ? (
            <p className="mt-2 text-muted-foreground">{category.description}</p>
          ) : (
            <p className="mt-2 text-muted-foreground">
              Explore our curated collection of {categoryName.toLowerCase()}
            </p>
          )}
        </div>
      }
    />
  );
}
