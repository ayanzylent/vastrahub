"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { IHydratedSiteSettings } from "@/types";
import { BlockRenderer } from "./block-renderer";
import { Skeleton } from "@/components/ui/skeleton";

function BlocksSkeleton() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Skeleton className="mb-10 h-8 w-56" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full" />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * The dynamic part of the homepage (below the hero): category / collection /
 * featured-product showcases, videos and banners. Fetched on the client so the
 * blocks stay fresh while the ISR-cached hero renders instantly.
 */
export function HomepageBlocks() {
  const [data, setData] = useState<IHydratedSiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get<IHydratedSiteSettings>("/api/v1/storefront/site-settings").then((res) => {
      if (cancelled) return;
      if (res.success && res.data) setData(res.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <BlocksSkeleton />;

  return <BlockRenderer blocks={data?.homepageBlocks ?? []} />;
}
