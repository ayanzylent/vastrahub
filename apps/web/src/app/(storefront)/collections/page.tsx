"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { CollectionCard } from "@/components/storefront/catalog/collection-card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { ICollection } from "@/types";

export default function CollectionsIndexPage() {
  const [collections, setCollections] = useState<ICollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCollections() {
      try {
        const res = await api.get<ICollection[]>("/api/v1/storefront/collections");
        if (res.success && res.data) {
          setCollections(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        setCollections([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCollections();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <span className="text-foreground">Collections</span>
      </nav>

      <div className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold">Collections</h1>
        <p className="mt-2 text-muted-foreground">
          Curated edits and themed selections, handpicked for you
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-4/5 w-full rounded-xl" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <LayoutGrid className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-heading text-lg font-semibold">No collections yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Check back soon — new curated collections are on the way.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {collections.map((col) => (
            <CollectionCard key={col._id} col={col} size="lg" />
          ))}
        </div>
      )}
    </div>
  );
}
