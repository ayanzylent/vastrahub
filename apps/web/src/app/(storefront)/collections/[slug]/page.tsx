"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ProductListing,
  COLLECTION_SORT_OPTIONS,
} from "@/components/storefront/catalog/product-listing";
import {
  useProductListing,
  type ListingFetchContext,
  type ProductWithSkus,
} from "@/hooks/use-product-listing";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/media";
import type { ICollection } from "@/types";

interface CollectionProductsResponse {
  success: boolean;
  data?: ICollection;
  products?: ProductWithSkus[];
  pagination?: { totalPages: number; total: number };
}

export default function CollectionPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [collection, setCollection] = useState<ICollection | null>(null);
  const [notFound, setNotFound] = useState(false);

  const collectionName =
    collection?.name ||
    slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const fetchPage = useCallback(
    async (ctx: ListingFetchContext) => {
      const res = await api.get<ICollection>(
        `/api/v1/storefront/collections/${slug}?${ctx.params.toString()}`,
      );
      const data = res as unknown as CollectionProductsResponse;
      if (data.success && data.data) {
        setCollection(data.data);
        setNotFound(false);
        return {
          products: data.products ?? [],
          totalPages: data.pagination?.totalPages ?? 1,
          total: data.pagination?.total ?? 0,
        };
      }
      setNotFound(true);
      return { products: [], totalPages: 1, total: 0 };
    },
    [slug],
  );

  const listing = useProductListing({
    defaultSort: "",
    fetchPage,
  });

  const showNotFound = notFound && !listing.loading;
  const bannerImage = collection?.bannerImage || collection?.image;

  return (
    <ProductListing
      listing={listing}
      sortOptions={COLLECTION_SORT_OPTIONS}
      emptyMessage="Try adjusting your filters to find what you're looking for."
      hideGrid={showNotFound}
      breadcrumb={
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/collections" className="hover:text-foreground">Collections</Link>
          <span>/</span>
          <span className="text-foreground">{collectionName}</span>
        </nav>
      }
      notFoundContent={
        showNotFound ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold">Collection not found</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              This collection may have been removed or is no longer available.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/collections">Browse Collections</Link>
            </Button>
          </div>
        ) : null
      }
      header={
        bannerImage ? (
          <div className="relative mb-8 overflow-hidden rounded-2xl">
            <div className="aspect-[21/9] w-full md:aspect-[3/1]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getMediaUrl(bannerImage)}
                alt={collectionName}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-8">
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-white">
                {collectionName}
              </h1>
              {collection?.description && (
                <p className="mt-2 max-w-2xl text-sm text-white/80">{collection.description}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <h1 className="font-heading text-3xl md:text-4xl font-bold">{collectionName}</h1>
            {collection?.description ? (
              <p className="mt-2 text-muted-foreground">{collection.description}</p>
            ) : (
              <p className="mt-2 text-muted-foreground">Explore this curated collection</p>
            )}
          </div>
        )
      }
    />
  );
}
