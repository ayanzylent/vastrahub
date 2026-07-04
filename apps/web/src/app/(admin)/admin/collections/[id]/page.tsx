"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Loader2,
  LayoutGrid,
  Hand,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/media";
import { formatPrice } from "@/lib/utils";
import type { ICollection } from "@vastrahub/shared-types";

interface PreviewProduct {
  _id: string;
  name: string;
  slug: string;
  variantMedia?: Array<{ isCoverGroup?: boolean; media?: Array<{ type: string; url: string }> }>;
  minPricePaise?: number;
  basePricePaise?: number;
  isActive?: boolean;
  publishedAt?: string | null;
}

function cover(p: PreviewProduct): string | null {
  const group = p.variantMedia?.find((vm) => vm.isCoverGroup) ?? p.variantMedia?.[0];
  const img = group?.media?.find((m) => m.type === "image");
  return img?.url ? getMediaUrl(img.url) : null;
}

export default function ViewCollectionPage() {
  const params = useParams();
  const id = params.id as string;

  const [collection, setCollection] = useState<ICollection | null>(null);
  const [products, setProducts] = useState<PreviewProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [colRes, prevRes] = await Promise.all([
        api.get<ICollection>(`/api/v1/admin/collections/${id}`),
        api.get<PreviewProduct[]>(`/api/v1/admin/collections/${id}/preview?limit=60`),
      ]);
      if (cancelled) return;
      if (colRes.success && colRes.data) setCollection(colRes.data);
      const data = (prevRes as unknown as { data?: PreviewProduct[] }).data ?? [];
      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Collection not found.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/collections">Back to Collections</Link>
        </Button>
      </div>
    );
  }

  const banner = collection.bannerImage || collection.image;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/collections">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-bold">{collection.name}</h1>
              <Badge variant="secondary" className="gap-1 capitalize text-[10px]">
                {collection.type === "automated" ? <Sparkles className="h-3 w-3" /> : <Hand className="h-3 w-3" />}
                {collection.type}
              </Badge>
            </div>
            <p className="font-mono text-xs text-muted-foreground">/{collection.slug}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/collections/${collection.slug}`} target="_blank">
              View on site
            </Link>
          </Button>
          <Button variant="default" asChild>
            <Link href={`/admin/collections/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div className="relative overflow-hidden rounded-xl border border-border/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getMediaUrl(banner)} alt={collection.name} className="aspect-[3/1] w-full object-cover" />
        </div>
      )}

      {/* Meta cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetaCard label="Products" value={String(collection.productCount)} />
        <MetaCard
          label="Status"
          value={collection.isActive ? "Active" : "Inactive"}
          badge={<StatusBadge tone={collection.isActive ? "success" : "neutral"}>{collection.isActive ? "Active" : "Inactive"}</StatusBadge>}
        />
        <MetaCard
          label="Featured"
          value={collection.isFeatured ? "Yes" : "No"}
          badge={collection.isFeatured ? <Star className="h-4 w-4 fill-primary text-primary" /> : undefined}
        />
        <MetaCard
          label={collection.type === "automated" ? "Match mode" : "Sort order"}
          value={collection.type === "automated" ? collection.matchMode : String(collection.sortOrder)}
        />
      </div>

      {collection.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{collection.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Automated rules summary */}
      {collection.type === "automated" && collection.rules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Rules — match {collection.matchMode === "all" ? "all" : "any"} of:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {collection.rules.map((r, i) => (
                <Badge key={i} variant="secondary" className="font-mono text-[11px]">
                  {r.field} {r.operator} {String(r.value)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolved products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" />
            Products in this collection ({collection.productCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No products currently match this collection.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => {
                const img = cover(p);
                const price = p.minPricePaise ?? p.basePricePaise ?? 0;
                const isLive = p.isActive && !!p.publishedAt;
                return (
                  <div key={p._id} className="rounded-lg border border-border/50 overflow-hidden">
                    <div className="aspect-square bg-muted/40 relative">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl font-heading text-primary/20">
                          {p.name[0]}
                        </div>
                      )}
                      {!isLive && (
                        <Badge variant="secondary" className="absolute top-1.5 left-1.5 text-[9px]">
                          {p.publishedAt ? "Inactive" : "Draft"}
                        </Badge>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium line-clamp-2 leading-snug">{p.name}</p>
                      {price > 0 && (
                        <p className="mt-1 text-xs font-semibold text-primary">{formatPrice(price)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {collection.productCount > products.length && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Showing first {products.length} of {collection.productCount}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetaCard({ label, value, badge }: { label: string; value: string; badge?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        {badge ? (
          <div className="mt-1.5">{badge}</div>
        ) : (
          <p className="mt-1 text-lg font-semibold capitalize">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
