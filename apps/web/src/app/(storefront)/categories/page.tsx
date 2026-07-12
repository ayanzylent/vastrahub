"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { LayoutGrid, ArrowRight } from "lucide-react";
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
          setCategories(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => {
        setCategories([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <span className="text-foreground">Categories</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold">Categories</h1>
        <p className="mt-2 text-muted-foreground">
          Explore our curated ranges of premium Indian wear
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {categories.map((cat) => (
            <Link key={cat._id} href={`/categories/${cat.slug}`}>
              <div className="group overflow-hidden rounded-xl bg-card text-sm text-card-foreground shadow-xs ring-1 ring-foreground/10 hover:border-primary/30 transition-all duration-300">
                <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center overflow-hidden">
                  {cat.image ? (
                    <Image
                      src={getMediaUrl(cat.image)}
                      alt={cat.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <LayoutGrid className="h-10 w-10 text-primary/30" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-lg font-semibold group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  {cat.description ? (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {cat.description}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {cat.productCount} product{cat.productCount === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
