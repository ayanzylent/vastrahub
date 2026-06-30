"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, Star, ShoppingBag, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";
import { getMediaUrl } from "@/lib/media";
import { useWishlist } from "@/providers/WishlistProvider";
import { useCart } from "@/providers/CartProvider";
import type { IProduct, ISku, IVariantMedia } from "@vastrahub/shared-types";

export interface ProductCardProduct {
  _id: string;
  name: string;
  slug: string;
  brandName?: string;
  variantMedia: IVariantMedia[];
  avgRating: number;
  reviewCount: number;
  isFeatured?: boolean;
  tags?: string[];
  basePricePaise?: number;
  baseMrpPaise?: number;
}

interface ProductCardProps {
  product: ProductCardProduct;
  sku?: ISku | null;
  /** Lowest price sku if multiple */
  lowestPricePaise?: number;
  lowestMrpPaise?: number;
  className?: string;
}

function getCoverImage(product: ProductCardProduct): string | null {
  const coverGroup = product.variantMedia.find((vm) => vm.isCoverGroup);
  const group = coverGroup || product.variantMedia[0];
  if (!group?.media?.length) return null;
  const firstImage = group.media.find((m) => m.type === "image");
  return firstImage?.url ? getMediaUrl(firstImage.url) : null;
}

export function ProductCard({ product, sku, lowestPricePaise, lowestMrpPaise, className }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addItem } = useCart();
  const router = useRouter();
  const wishlisted = isInWishlist(product._id);
  const [addingToCart, setAddingToCart] = useState(false);

  const imageUrl = getCoverImage(product);
  const sellingPrice = sku?.pricePaise ?? lowestPricePaise ?? 0;
  const mrpPrice = sku?.mrpPaise ?? lowestMrpPaise ?? 0;
  const discount = mrpPrice > sellingPrice ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100) : 0;

  /**
   * Quick-add to cart:
   * - If a specific SKU is provided, add it directly (qty=1).
   * - Otherwise, navigate to the product detail page for variant selection.
   */
  async function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (sku) {
      setAddingToCart(true);
      await addItem(sku._id, 1);
      setAddingToCart(false);
    } else {
      router.push(`/products/${product.slug}`);
    }
  }

  return (
    <Card className={cn("group overflow-hidden hover:border-primary/30 transition-all duration-300", className)}>
      <CardContent className="p-0">
        <Link href={`/products/${product.slug}`} className="block">
          <div className="relative aspect-[3/4] bg-gradient-to-br from-muted to-muted/60 overflow-hidden">
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
                <span className="text-4xl font-heading font-bold text-primary/20">
                  {product.name[0]}
                </span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.isFeatured && (
                <Badge variant="secondary" className="text-[10px]">Bestseller</Badge>
              )}
              {discount > 0 && (
                <Badge className="border-transparent bg-emerald-600 text-[10px] text-white">
                  {discount}% OFF
                </Badge>
              )}
            </div>

            {/* Rating badge */}
            {product.avgRating > 0 && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[10px] text-white">
                <Star className="h-2.5 w-2.5 fill-primary text-primary" />
                <span>{product.avgRating.toFixed(1)}</span>
                {product.reviewCount > 0 && (
                  <span className="text-white/60">({product.reviewCount})</span>
                )}
              </div>
            )}
          </div>
        </Link>

        {/* Product info */}
        <div className="p-3 space-y-1.5">
          <Link href={`/products/${product.slug}`}>
            <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.brandName && (
            <p className="text-xs text-muted-foreground truncate">
              {product.brandName}
            </p>
          )}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-primary">
                {formatPrice(sellingPrice)}
              </span>
              {discount > 0 && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(mrpPrice)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                disabled={addingToCart}
                onClick={handleQuickAdd}
              >
                {addingToCart ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShoppingBag
                    className="h-3.5 w-3.5 text-muted-foreground transition-colors hover:text-primary"
                  />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleWishlist(product._id);
                }}
              >
                <Heart
                  className={cn(
                    "h-3.5 w-3.5 transition-colors",
                    wishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"
                  )}
                />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
