"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, LayoutGrid, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/media";
import type { ICategory } from "@/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ICategory[]>("/api/v1/storefront/categories")
      .then((res) => {
        if (res.success && res.data) {
          // Filter to only display active categories
          setCategories(res.data.filter((cat) => cat.isActive));
        }
      })
      .catch(() => {
        // silent fallback
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Categories</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold">Shop by Category</h1>
        <p className="mt-2 text-muted-foreground">
          Explore our curated collections of premium Indian wear, handpicked for you.
        </p>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="aspect-[4/5] w-full rounded-none" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/4 mx-auto" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <LayoutGrid className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-heading text-lg font-semibold">No categories found</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            We are currently updating our categories. Please check back later.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Back to Home
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link key={cat._id} href={`/categories/${cat.slug}`} className="group">
              <Card className="h-full overflow-hidden hover:border-primary/30 shadow-sm transition-all duration-300">
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="relative aspect-[4/5] bg-gradient-to-br from-primary/5 to-muted overflow-hidden">
                    {cat.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getMediaUrl(cat.image)}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-5xl font-heading font-bold text-primary/20 group-hover:text-primary/30 transition-colors">
                          {cat.name[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 text-center flex-1 flex flex-col justify-center">
                    <h3 className="font-heading text-base font-semibold group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {cat.description}
                      </p>
                    )}
                    <span className="inline-flex items-center justify-center gap-1 mt-2 text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground w-fit mx-auto">
                      <Package className="h-3 w-3" />
                      {cat.productCount} {cat.productCount === 1 ? "item" : "items"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
