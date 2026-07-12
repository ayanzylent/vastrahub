"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { IHydratedSiteSettings } from "@/types";
import { BlockRenderer } from "./block-renderer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<IHydratedSiteSettings>("/api/v1/storefront/site-settings");
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || "Failed to load homepage sections.");
      }
    } catch {
      setError("Failed to load homepage sections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <BlocksSkeleton />;

  if (error) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={load}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </section>
    );
  }

  return <BlockRenderer blocks={data?.homepageBlocks ?? []} />;
}
