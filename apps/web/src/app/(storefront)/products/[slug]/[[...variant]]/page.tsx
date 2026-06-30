"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Heart, ShoppingBag, Share2, Truck, Shield, RotateCcw, Star, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatPrice } from "@/lib/utils";
import { getMediaUrl } from "@/lib/media";
import { api } from "@/lib/api";
import { useCart } from "@/providers/CartProvider";
import { useWishlist } from "@/providers/WishlistProvider";
import { toast } from "sonner";
import type { IProduct, ISku, ICategory, IMediaItem } from "@vastrahub/shared-types";

/**
 * The server returns the product (or redirect info) at the TOP level of the response JSON:
 *   { success, statusCode, data: <product>, redirect?: true, newSlug?: string }
 * `api.get` casts `response.json()` directly to ApiResponse<T>, so `res` IS that object.
 * T here is the product payload inside `data`.
 */
interface SlugApiResponse {
  success: boolean;
  statusCode: number;
  redirect?: boolean;
  newSlug?: string;
  data?: IProduct & {
    category?: ICategory;
    skus?: ISku[];
    sisterProducts?: Array<{ _id: string; name: string; slug: string }>;
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const slug = params.slug as string;
  const variantParam = (params.variant as string[] | undefined)?.[0];

  const [product, setProduct] = useState<SlugApiResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<IMediaItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedSku, setSelectedSku] = useState<ISku | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        // api.get returns the raw server JSON cast to SlugApiResponse.
        // Server shape: { success, statusCode, data: product, redirect?, newSlug? }
        const res = await api.get<SlugApiResponse>(`/api/v1/storefront/products/${slug}`);
        if (res.success) {
          const body = res as unknown as SlugApiResponse;
          if (body.redirect && body.newSlug) {
            router.replace(`/products/${body.newSlug}${variantParam ? `/${variantParam}` : ""}`);
            return;
          }
          if (body.data) {
            setProduct(body.data);
          }
        }
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug, router, variantParam]);

  // Find current variant media group
  // When showVisualSelector is false, always show cover group (ignore variant URL)
  const currentVariantGroup = useMemo(() => {
    return (product?.showVisualSelector !== false && variantParam)
      ? (product?.variantMedia?.find(
        (vm) => vm.variantSlug === variantParam
      ) || product?.variantMedia?.find((vm) => vm.isCoverGroup) || product?.variantMedia?.[0])
      : (product?.variantMedia?.find((vm) => vm.isCoverGroup) || product?.variantMedia?.[0]);
  }, [product, variantParam]);

  const mediaItems = useMemo(() => currentVariantGroup?.media || [], [currentVariantGroup]);

  // Set initial media
  useEffect(() => {
    if (mediaItems.length > 0 && !selectedMedia) {
      setSelectedMedia(mediaItems[0]);
    }
  }, [mediaItems, selectedMedia]);

  // Reset media when variant changes
  useEffect(() => {
    if (mediaItems.length > 0) {
      setSelectedMedia(mediaItems[0]);
    }
  }, [mediaItems]);

  // Redirect stale variant URLs when visual selector is hidden
  useEffect(() => {
    if (product && product.showVisualSelector === false && variantParam) {
      router.replace(`/products/${slug}`);
    }
  }, [product, variantParam, slug, router]);

  // Get color variant option
  const colorOption = product?.variantOptions?.find(
    (opt) => opt.name.toLowerCase() === (product.visualAttributeName?.toLowerCase() || "color")
  );
  const sizeOption = product?.variantOptions?.find(
    (opt) => opt.name.toLowerCase() === "size"
  );

  // Find matching SKU — uses `attributes` (the actual DB/lean field name for the Map)
  const findSku = useCallback((color: string | undefined, size: string) => {
    if (!product?.skus) return null;
    return product.skus.find((sku) => {
      const combo = sku.attributes ?? {};
      const colorMatch = !color || !colorOption || combo[colorOption.name] === color;
      const sizeMatch = !sizeOption || combo[sizeOption.name] === size;
      return colorMatch && sizeMatch;
    }) || null;
  }, [product, colorOption, sizeOption]);

  useEffect(() => {
    if (product) {
      const currentColor = currentVariantGroup?.variantValue;
      if (!sizeOption) {
        // No sizes: find active SKU for current color
        const activeSku = product.skus?.find(
          (s) => s.isActive && (!currentColor || !colorOption || (s.attributes ?? {})[colorOption.name] === currentColor)
        ) || product.skus?.[0] || null;
        setSelectedSku(activeSku);
      } else {
        // Sizes exist: check if selectedSize is valid for the new color
        let targetSku = selectedSize ? findSku(currentColor, selectedSize) : null;

        // If not valid or no size selected, auto-select default/first active SKU for new color
        if (!targetSku) {
          const activeSku = product.skus?.find(
            (s) => s.isDefault && s.isActive && (!currentColor || !colorOption || (s.attributes ?? {})[colorOption.name] === currentColor)
          ) || product.skus?.find(
            (s) => s.isActive && (!currentColor || !colorOption || (s.attributes ?? {})[colorOption.name] === currentColor)
          );

          if (activeSku) {
            const sizeVal = (activeSku.attributes ?? {})[sizeOption.name];
            if (sizeVal) {
              setSelectedSize(sizeVal);
              targetSku = activeSku;
            }
          }
        }

        setSelectedSku(targetSku);
      }
    }
  }, [selectedSize, currentVariantGroup, product, sizeOption, colorOption, findSku]);

  // Get display price from selected SKU or first SKU
  const displaySku = selectedSku || product?.skus?.[0];
  const sellingPrice = displaySku?.pricePaise ?? 0;
  const mrpPrice = displaySku?.mrpPaise ?? 0;
  const discount = mrpPrice > sellingPrice ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100) : 0;

  async function handleAddToCart() {
    if (!selectedSku) {
      toast.error("Please select a size");
      return;
    }
    setAddingToCart(true);
    await addItem(selectedSku._id, quantity);
    setAddingToCart(false);
  }

  const wishlisted = product ? isInWishlist(product._id) : false;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-12">
        <Skeleton className="h-4 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <Skeleton className="aspect-[3/4] w-full rounded-xl" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-20 text-center">
        <h2 className="font-heading text-2xl font-bold">Product not found</h2>
        <p className="mt-2 text-muted-foreground">This product may have been removed.</p>
        <Button variant="default" asChild className="mt-6">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link href={`/categories/${product.category.slug}`} className="hover:text-foreground">
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground truncate">{product.name}</span>
        {product.showVisualSelector !== false && variantParam && (
          <>
            <span>/</span>
            <span className="text-primary">{currentVariantGroup?.variantLabel || variantParam}</span>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* ─── Image Gallery ─── */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-card">
            {selectedMedia ? (
              selectedMedia.type === "video" ? (
                <video
                  src={getMediaUrl(selectedMedia.url)}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={getMediaUrl(selectedMedia.url)}
                  alt={selectedMedia.alt || product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              )
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-6xl font-heading font-bold text-primary/20">
                  {product.name[0]}
                </span>
              </div>
            )}
          </div>
          {/* Thumbnail Row */}
          {mediaItems.length > 1 && (
            <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
              {mediaItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedMedia(item)}
                  className={cn(
                    "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                    selectedMedia?.url === item.url
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-transparent hover:border-primary/30"
                  )}
                >
                  {item.type === "video" ? (
                    <div className="flex items-center justify-center h-full bg-muted text-xs">▶</div>
                  ) : (
                    <Image
                      src={getMediaUrl(item.thumbnailUrl || item.url)}
                      alt={item.alt || `${product.name} ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Product Info ─── */}
        <div className="space-y-6">
          <div>
            {product.isFeatured && <Badge variant="secondary" className="mb-3">Featured</Badge>}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <h1 className="font-heading text-2xl md:text-3xl font-bold break-words">{product.name}</h1>
                {product.brand && (
                  <p className="text-sm text-muted-foreground">{product.brand}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0 pt-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => toggleWishlist(product._id)}
                >
                  <Heart
                    className={cn(
                      "h-5 w-5",
                      wishlisted ? "fill-red-500 text-red-500" : ""
                    )}
                  />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied!");
                  }}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
            {product.shortDescription && (
              <p className="mt-2 text-muted-foreground">{product.shortDescription}</p>
            )}
          </div>

          {/* Rating */}
          {product.averageRating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md px-2 py-0.5 text-sm font-medium">
                <Star className="h-3.5 w-3.5 fill-current" />
                {product.averageRating.toFixed(1)}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.reviewCount} reviews
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">{formatPrice(sellingPrice)}</span>
            {discount > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(mrpPrice)}
                </span>
                <Badge className="border-transparent bg-emerald-600 text-white">
                  {discount}% OFF
                </Badge>
              </>
            )}
          </div>

          <Separator />

          {/* Color Selector — only shown when showVisualSelector is enabled */}
          {product.showVisualSelector !== false && colorOption && colorOption.values.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">
                {colorOption.name}:{" "}
                <span className="text-primary">
                  {currentVariantGroup?.variantLabel || "Select"}
                </span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {colorOption.values.map((color) => {
                  const isActive = currentVariantGroup?.variantSlug === color.slug;
                  return (
                    <button
                      key={color.slug}
                      onClick={() => router.push(`/products/${product.slug}/${color.slug}`)}
                      className={cn(
                        "relative rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                      title={color.label}
                    >
                      {color.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {sizeOption && sizeOption.values.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Size</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizeOption.values.map((size) => {
                  const sku = findSku(currentVariantGroup?.variantValue, size.value);
                  const outOfStock = sku && sku.stockQuantity === 0;
                  const isSelected = selectedSize === size.value;

                  return (
                    <button
                      key={size.value}
                      onClick={() => !outOfStock && setSelectedSize(size.value)}
                      disabled={!!outOfStock}
                      className={cn(
                        "h-10 min-w-[44px] rounded-lg border px-3 text-sm font-medium transition-all",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 hover:bg-primary/5",
                        outOfStock && "opacity-40 cursor-not-allowed line-through"
                      )}
                    >
                      {size.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <h3 className="text-sm font-medium mb-3">Quantity</h3>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                disabled={quantity >= 10}
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-11 sm:h-12 text-sm sm:text-base px-3 sm:px-6"
              onClick={handleAddToCart}
              disabled={addingToCart || !selectedSku}
            >
              <ShoppingBag className="mr-1 sm:mr-2 h-4 w-4 shrink-0" />
              {addingToCart ? "Adding..." : "Add to Cart"}
            </Button>
            <Button
              variant="default"
              size="lg"
              className="flex-1 h-11 sm:h-12 text-sm sm:text-base px-3 sm:px-6 font-bold"
              onClick={() => {
                if (!selectedSku) {
                  toast.error("Please select a size");
                  return;
                }
                router.push(`/checkout?mode=buynow&skuId=${selectedSku._id}&qty=${quantity}`);
              }}
              disabled={!selectedSku}
            >
              Buy Now
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: Truck, label: "Free Shipping" },
              { icon: Shield, label: "Authentic" },
              { icon: RotateCcw, label: "Easy Returns" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 rounded-lg border border-border/50 p-3 text-center">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Tabs: Description / Details / Reviews ─── */}
      <div className="mt-12 md:mt-16">
        <Tabs defaultValue="description">
          <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none p-0">
            <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Description
            </TabsTrigger>
            <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Details
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Reviews ({product.reviewCount})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="pt-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-muted-foreground whitespace-pre-wrap">
                {product.description || "No description available."}
              </p>
            </div>
          </TabsContent>
          <TabsContent value="details" className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm max-w-md">
              {product.brand && (
                <>
                  <div className="text-muted-foreground">Brand</div>
                  <div>{product.brand}</div>
                </>
              )}
              {product.hsn && (
                <>
                  <div className="text-muted-foreground">HSN Code</div>
                  <div>{product.hsn}</div>
                </>
              )}
              <div className="text-muted-foreground">GST</div>
              <div>{product.gstPercentage ?? "—"}%</div>
              {product.tags?.length > 0 && (
                <>
                  <div className="text-muted-foreground">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </>
              )}
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="pt-6">
            {product.reviewCount === 0 ? (
              <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
            ) : (
              <p className="text-muted-foreground">Reviews coming soon.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
