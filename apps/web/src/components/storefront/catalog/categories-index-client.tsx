"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { CategoryCard } from "@/components/storefront/catalog/category-card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { ICategory } from "@/types";

export function CategoriesIndexClient({
  initialCategories = [],
}: {
  initialCategories?: ICategory[];
}) {
  const [categories, setCategories] = useState<ICategory[]>(initialCategories);
  const [loading, setLoading] = useState(initialCategories.length === 0);

  useEffect(() => {
    if (initialCategories.length > 0) {
      setCategories(initialCategories);
      setLoading(false);
      return;
    }
    api
      .get<ICategory[]>("/api/v1/storefront/categories")
      .then((res) => {
        if (res.success && res.data) {
          setCategories(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => {
        setCategories([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [initialCategories]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <span className="text-foreground">Categories</span>
      </nav>

      <div className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold">Categories</h1>
        <p className="mt-2 text-muted-foreground">
          Explore our curated ranges of premium Indian wear
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-4/5 w-full rounded-xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <LayoutGrid className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-heading text-lg font-semibold">No categories yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Check back soon — new curated categories are on the way.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {categories.map((cat) => (
            <CategoryCard key={cat._id} cat={cat} size="lg" />
          ))}
        </div>
      )}
    </div>
  );
}
