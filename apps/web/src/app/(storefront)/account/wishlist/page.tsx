"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Star, Loader2, X } from "lucide-react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { getMediaUrl } from "@/lib/media";
import { useWishlist } from "@/providers/WishlistProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface WishlistProductData {
  _id: string;
  name: string;
  slug: string;
  basePricePaise: number;
  baseMrpPaise: number;
  averageRating?: number;
  reviewCount?: number;
  coverImage?: string;
  isActive: boolean;
}

interface WishlistApiItem {
  productId: string;
  addedAt: string;
  product?: WishlistProductData;
}

interface WishlistApiResponse {
  _id: string;
  userId: string;
  items: WishlistApiItem[];
}

function WishlistCard({
  product,
  onRemove,
  removing,
}: {
  product: WishlistProductData;
  onRemove: (id: string) => void;
  removing: boolean;
}) {
  const imageUrl = getMediaUrl(product.coverImage);
  const price = product.basePricePaise ?? 0;
  const mrp = product.baseMrpPaise ?? 0;
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <Card className="group relative overflow-hidden transition-colors hover:border-primary/30">
      <CardContent className="p-0">
        <Link href={`/products/${product.slug}`} className="block">
          <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-muted to-muted/60">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="font-heading text-4xl font-bold text-primary/20">
                  {product.name[0]}
                </span>
              </div>
            )}

            {discount > 0 && (
              <Badge className="absolute left-2 top-2 border-transparent bg-emerald-600 text-[10px] text-white">
                {discount}% OFF
              </Badge>
            )}

            {(product.averageRating ?? 0) > 0 && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
                <Star className="h-2.5 w-2.5 fill-primary text-primary" />
                <span>{(product.averageRating ?? 0).toFixed(1)}</span>
              </div>
            )}
          </div>
        </Link>

        {/* Remove button */}
        <button
          type="button"
          aria-label="Remove from wishlist"
          onClick={() => onRemove(product._id)}
          disabled={removing}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-destructive disabled:opacity-60"
        >
          {removing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </button>

        <div className="space-y-1.5 p-3">
          <Link href={`/products/${product.slug}`}>
            <h3 className="line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-primary">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-primary">
              {formatPrice(price)}
            </span>
            {discount > 0 && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(mrp)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WishlistPage() {
  const { removeFromWishlist } = useWishlist();
  const [products, setProducts] = useState<WishlistProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadWishlist() {
      setLoading(true);
      const res = await api.get<WishlistApiResponse>("/api/v1/user/wishlist");
      if (!active) return;
      if (res.success && res.data) {
        const items = (res.data.items ?? [])
          .map((i) => i.product)
          .filter((p): p is WishlistProductData => !!p && p.isActive);
        setProducts(items);
      } else {
        toast.error(res.error || "Failed to load wishlist");
      }
      setLoading(false);
    }
    loadWishlist();
    return () => {
      active = false;
    };
  }, []);

  async function handleRemove(productId: string) {
    setRemovingId(productId);
    const ok = await removeFromWishlist(productId);
    if (ok) {
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      toast.success("Removed from wishlist");
    } else {
      toast.error("Failed to remove item");
    }
    setRemovingId(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">
          Wishlist{products.length > 0 ? ` (${products.length})` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Items you&apos;ve saved for later.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="aspect-[3/4] w-full" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Heart className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="font-heading text-lg font-semibold">
              Your wishlist is empty
            </h3>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">
              Browse the collection and tap the heart to save items.
            </p>
            <Button asChild>
              <Link href="/shop">Explore Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {products.map((product) => (
            <WishlistCard
              key={product._id}
              product={product}
              onRemove={handleRemove}
              removing={removingId === product._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
