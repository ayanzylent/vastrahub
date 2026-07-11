"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Heart,
  ShoppingBag,
  Share2,
  Star,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatPrice } from "@/lib/utils";
import { getMediaUrl } from "@/lib/media";
import { api } from "@/lib/api";
import { useCart } from "@/providers/CartProvider";
import { useWishlist } from "@/providers/WishlistProvider";
import { toast } from "sonner";
import type { IProduct, ISku, ICategory, IMediaItem, IProductPageConfig } from "@/types";
import { DEFAULT_PRODUCT_PAGE } from "@/constants";
import { ProductSettingsPanel } from "@/components/storefront/product/product-settings-panel";
import { normalizeProductPage } from "@/lib/site-settings-normalize";

/* ────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────── */

interface SlugApiResponse {
  success: boolean;
  statusCode: number;
  redirect?: boolean;
  newSlug?: string;
  data?: IProduct & {
    category?: ICategory;
    skus?: ISku[];
    sisterProducts?: Array<{
      _id: string;
      name: string;
      slug: string;
      variantMedia?: Array<{
        isCoverGroup?: boolean;
        media?: Array<{ type: string; url: string; alt?: string; thumbnailUrl?: string }>;
      }>;
      basePricePaise?: number;
      baseMrpPaise?: number;
      minPricePaise?: number;
      maxPricePaise?: number;
      minMrpPaise?: number;
      maxMrpPaise?: number;
    }>;
  };
}


/* ────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────── */

function getSisterCoverImage(
  sister: SlugApiResponse["data"] extends infer T
    ? T extends { sisterProducts?: infer S }
      ? S extends Array<infer I>
        ? I
        : never
      : never
    : never,
): string | null {
  if (!sister.variantMedia?.length) return null;
  const coverGroup =
    sister.variantMedia.find((vm) => vm.isCoverGroup) || sister.variantMedia[0];
  if (!coverGroup?.media?.length) return null;
  const firstImage = coverGroup.media.find((m) => m.type === "image");
  return firstImage?.url ? getMediaUrl(firstImage.url) : null;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────────────────────────── */

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const slug = params.slug as string;
  const variantParam = (params.variant as string[] | undefined)?.[0];

  /* ── Core state ── */
  const [product, setProduct] = useState<SlugApiResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<IMediaItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedSku, setSelectedSku] = useState<ISku | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [productPageSettings, setProductPageSettings] = useState<IProductPageConfig>(DEFAULT_PRODUCT_PAGE);

  /* ── UI state ── */
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const ctaSectionRef = useRef<HTMLDivElement>(null);

  /* ────────────────────────────────────────────────────────────────
     Fetch product
     ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const [res, settingsRes] = await Promise.all([
          api.get<SlugApiResponse>(`/api/v1/storefront/products/${slug}`),
          api.get<IProductPageConfig>("/api/v1/storefront/product-page-settings"),
        ]);
        if (settingsRes.success && settingsRes.data) setProductPageSettings(normalizeProductPage(settingsRes.data));
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

  /* ────────────────────────────────────────────────────────────────
     Sticky bar visibility — show when CTA buttons scroll out of view
     ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const el = ctaSectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product]);

  /* ────────────────────────────────────────────────────────────────
     Media / Variant logic (preserved from original)
     ──────────────────────────────────────────────────────────────── */
  const currentVariantGroup = useMemo(() => {
    return product?.showVisualSelector !== false && variantParam
      ? product?.variantMedia?.find((vm) => vm.variantSlug === variantParam) ||
          product?.variantMedia?.find((vm) => vm.isCoverGroup) ||
          product?.variantMedia?.[0]
      : product?.variantMedia?.find((vm) => vm.isCoverGroup) || product?.variantMedia?.[0];
  }, [product, variantParam]);

  const mediaItems = useMemo(() => currentVariantGroup?.media || [], [currentVariantGroup]);

  const activeIndex = useMemo(
    () => Math.max(0, mediaItems.findIndex((item) => item.url === selectedMedia?.url)),
    [mediaItems, selectedMedia],
  );

  /* ── Touch swipe ── */
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = mediaItems.findIndex((item) => item.url === selectedMedia?.url);
      if (currentIndex !== -1) {
        if (isLeftSwipe && currentIndex < mediaItems.length - 1) {
          setSelectedMedia(mediaItems[currentIndex + 1]);
        } else if (isRightSwipe && currentIndex > 0) {
          setSelectedMedia(mediaItems[currentIndex - 1]);
        }
      }
    }
    setTouchStartX(0);
    setTouchEndX(0);
  }, [touchStartX, touchEndX, mediaItems, selectedMedia]);

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

  /* ── Variant options ── */
  const colorOption = product?.variantOptions?.find(
    (opt) => opt.name.toLowerCase() === (product.visualAttributeName?.toLowerCase() || "color"),
  );
  const sizeOption = product?.variantOptions?.find(
    (opt) => opt.name.toLowerCase() === "size",
  );

  // Find matching SKU
  const findSku = useCallback(
    (color: string | undefined, size: string) => {
      if (!product?.skus) return null;
      return (
        product.skus.find((sku) => {
          const combo = sku.attributes ?? {};
          const colorMatch = !color || !colorOption || combo[colorOption.name] === color;
          const sizeMatch = !sizeOption || combo[sizeOption.name] === size;
          return colorMatch && sizeMatch;
        }) || null
      );
    },
    [product, colorOption, sizeOption],
  );

  useEffect(() => {
    if (product) {
      const currentColor = currentVariantGroup?.variantValue;
      if (!sizeOption) {
        const activeSku =
          product.skus?.find(
            (s) =>
              s.isActive &&
              (!currentColor ||
                !colorOption ||
                (s.attributes ?? {})[colorOption.name] === currentColor),
          ) ||
          product.skus?.[0] ||
          null;
        setSelectedSku(activeSku);
      } else {
        let targetSku = selectedSize ? findSku(currentColor, selectedSize) : null;

        if (!targetSku) {
          const activeSku =
            product.skus?.find(
              (s) =>
                s.isDefault &&
                s.isActive &&
                (!currentColor ||
                  !colorOption ||
                  (s.attributes ?? {})[colorOption.name] === currentColor),
            ) ||
            product.skus?.find(
              (s) =>
                s.isActive &&
                (!currentColor ||
                  !colorOption ||
                  (s.attributes ?? {})[colorOption.name] === currentColor),
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

  /* ── Derived pricing ── */
  const displaySku = selectedSku || product?.skus?.[0];
  const sellingPrice = displaySku?.pricePaise ?? 0;
  const mrpPrice = displaySku?.mrpPaise ?? 0;
  const discount =
    mrpPrice > sellingPrice ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100) : 0;

  /* ── Actions ── */
  async function handleAddToCart() {
    if (!selectedSku) {
      toast.error("Please select a size");
      return;
    }
    setAddingToCart(true);
    await addItem(selectedSku._id, quantity);
    setAddingToCart(false);
  }

  function handleBuyNow() {
    if (!selectedSku) {
      toast.error("Please select a size");
      return;
    }
    router.push(`/checkout?mode=buynow&skuId=${selectedSku._id}&qty=${quantity}`);
  }

  function handleWhatsAppShare() {
    const text = `Check out ${product?.name} on VastraHub!\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  const wishlisted = product ? isInWishlist(product._id) : false;

  /* ────────────────────────────────────────────────────────────────
     Loading skeleton
     ──────────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-3 md:px-6 py-4 md:py-12">
        <Skeleton className="h-3 w-32 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          <div className="space-y-3">
            <Skeleton className="aspect-[3/4] w-full rounded-xl" />
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-3 pt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ────────────────────────────────────────────────────────────────
     Not found
     ──────────────────────────────────────────────────────────────── */
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

  /* ────────────────────────────────────────────────────────────────
     Description helper
     ──────────────────────────────────────────────────────────────── */
  const descriptionText = product.description || "";
  const isLongDescription = descriptionText.length > 250;

  /* ────────────────────────────────────────────────────────────────
     Product details key-value pairs
     ──────────────────────────────────────────────────────────────── */
  const productDetails: Array<{ label: string; value: string }> = [];
  if (product.brand) productDetails.push({ label: "Brand", value: product.brand });
  if (product.material) productDetails.push({ label: "Material", value: product.material });
  if (product.careInstructions)
    productDetails.push({ label: "Care Instructions", value: product.careInstructions });
  if (product.originCountry)
    productDetails.push({ label: "Country of Origin", value: product.originCountry });
  if (product.hsn) productDetails.push({ label: "HSN Code", value: product.hsn });
  if (product.gstPercentage !== null && product.gstPercentage !== undefined)
    productDetails.push({ label: "GST", value: `${product.gstPercentage}%` });
  if (displaySku?.sku) productDetails.push({ label: "SKU", value: displaySku.sku });

  /* ────────────────────────────────────────────────────────────────
     Render — main
     ──────────────────────────────────────────────────────────────── */
  return (
    <>
      <div className="mx-auto max-w-7xl px-3 md:px-6 py-4 md:py-12 pb-28 lg:pb-12">
        {/* ── Breadcrumb (compact on mobile) ── */}
        <nav className="mb-3 md:mb-6 flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-none">
          <Link href="/" className="hover:text-foreground shrink-0">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
          {product.category && (
            <>
              <Link
                href={`/categories/${product.category.slug}`}
                className="hover:text-foreground shrink-0"
              >
                {product.category.name}
              </Link>
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
            </>
          )}
          <span className="text-foreground truncate max-w-[180px] md:max-w-none">
            {product.name}
          </span>
          {product.showVisualSelector !== false && variantParam && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
              <span className="text-primary shrink-0">
                {currentVariantGroup?.variantLabel || variantParam}
              </span>
            </>
          )}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* ═══════════════════════════════════════════
              LEFT COLUMN: Image Gallery
              ═══════════════════════════════════════════ */}
          <div className="space-y-3">
            {/* Main Image */}
            <div
              className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-card touch-pan-y select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {mediaItems.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <span className="text-6xl font-heading font-bold text-primary/20">
                    {product.name[0]}
                  </span>
                </div>
              ) : (
                <div
                  className="flex w-full h-full"
                  style={{
                    transform: `translateX(-${activeIndex * 100}%)`,
                    transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  {mediaItems.map((item, idx) => (
                    <div key={idx} className="relative w-full h-full shrink-0">
                      {item.type === "video" ? (
                        <video
                          src={getMediaUrl(item.url)}
                          controls
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={getMediaUrl(item.url)}
                          alt={item.alt || product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          priority={idx === 0}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Overlay badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {product.isFeatured && (
                  <Badge variant="secondary" className="text-[10px] shadow-sm">
                    Bestseller
                  </Badge>
                )}
              </div>

              {/* Swipe dot indicator (mobile) */}
              {mediaItems.length > 1 && selectedMedia && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none lg:hidden">
                  {mediaItems.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === activeIndex
                          ? "w-4 bg-primary"
                          : "w-1.5 bg-white/60",
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Row */}
            {mediaItems.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {mediaItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedMedia(item)}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                      selectedMedia?.url === item.url
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-primary/30",
                    )}
                  >
                    {item.type === "video" ? (
                      <div className="flex items-center justify-center h-full bg-muted text-xs">
                        ▶
                      </div>
                    ) : (
                      <Image
                        src={getMediaUrl(item.thumbnailUrl || item.url)}
                        alt={item.alt || `${product.name} ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════
              RIGHT COLUMN: Product Info (vertically stacked)
              ═══════════════════════════════════════════ */}
          <div className="space-y-5">
            {/* ── Brand + Title + Rating ── */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  {product.brand && (
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      {product.brand}
                    </p>
                  )}
                  <h1 className="font-heading text-xl md:text-2xl lg:text-3xl font-bold leading-tight break-words">
                    {product.name}
                  </h1>
                </div>
                {/* Share buttons — desktop only, mobile uses sticky bar */}
                <div className="hidden lg:flex gap-1.5 shrink-0 pt-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => toggleWishlist(product._id)}
                    aria-label="Toggle wishlist"
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4",
                        wishlisted ? "fill-red-500 text-red-500" : "",
                      )}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={handleWhatsAppShare}
                    aria-label="Share on WhatsApp"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied!");
                    }}
                    aria-label="Copy link"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {product.shortDescription && (
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {product.shortDescription}
                </p>
              )}

              {/* Rating (inline below title) */}
              {product.averageRating > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md px-2 py-0.5 text-sm font-semibold">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {product.averageRating.toFixed(1)}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.reviewCount} {product.reviewCount === 1 ? "Review" : "Reviews"}
                  </span>
                </div>
              )}

              {/* Mobile share icons row */}
              <div className="flex items-center gap-2 mt-3 lg:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={handleWhatsAppShare}
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied!");
                  }}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Copy Link
                </Button>
              </div>
            </div>

            <Separator />

            {/* ── Price Block ── */}
            <div>
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-2xl md:text-3xl font-bold text-primary">
                  {formatPrice(sellingPrice)}
                </span>
                {discount > 0 && (
                  <>
                    <span className="text-base md:text-lg text-muted-foreground line-through">
                      {formatPrice(mrpPrice)}
                    </span>
                    <Badge className="border-transparent bg-emerald-600 text-white text-xs">
                      {discount}% OFF
                    </Badge>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Inclusive of all taxes</p>
            </div>

            {/* ── Color Selector ── */}
            {product.showVisualSelector !== false &&
              colorOption &&
              colorOption.values.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2.5">
                    {colorOption.name}:{" "}
                    <span className="text-primary font-semibold">
                      {currentVariantGroup?.variantLabel || "Select"}
                    </span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {colorOption.values.map((color) => {
                      const isActive =
                        currentVariantGroup?.variantSlug === color.slug;
                      return (
                        <button
                          key={color.slug}
                          onClick={() =>
                            router.push(`/products/${product.slug}/${color.slug}`)
                          }
                          className={cn(
                            "relative rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all",
                            isActive
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50",
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

            {/* ── Size Selector ── */}
            {sizeOption && sizeOption.values.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-sm font-medium">
                    Size:{" "}
                    <span className="text-primary font-semibold">
                      {selectedSize || "Select"}
                    </span>
                  </h3>
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
                          outOfStock && "opacity-40 cursor-not-allowed line-through",
                        )}
                      >
                        {size.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Quantity (compact) ── */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Qty:</span>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="text-sm font-medium w-8 text-center border-x">
                  {quantity}
                </span>
                <button
                  className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
                  disabled={quantity >= 10}
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* ── CTA Buttons (desktop inline, observed for sticky bar trigger) ── */}
            <div ref={ctaSectionRef} className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-12 text-sm font-semibold"
                onClick={handleAddToCart}
                disabled={addingToCart || !selectedSku}
              >
                <ShoppingBag className="mr-2 h-4 w-4 shrink-0" />
                {addingToCart ? "Adding..." : "Add to Cart"}
              </Button>
              <Button
                variant="default"
                size="lg"
                className="flex-1 h-12 text-sm font-bold"
                onClick={handleBuyNow}
                disabled={!selectedSku}
              >
                Buy Now
              </Button>
            </div>

            <Separator />

            {/* ── Delivery & Services ── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Delivery & Services</h3>
              <ProductSettingsPanel settings={productPageSettings} />
            </div>

            <Separator />

            {/* ── Product Details (inline, no tabs) ── */}
            {productDetails.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Product Details</h3>
                <div className="space-y-0 rounded-lg border border-border/50 overflow-hidden">
                  {productDetails.map(({ label, value }, i) => (
                    <div
                      key={label}
                      className={cn(
                        "flex items-start gap-4 px-3 py-2.5 text-sm",
                        i % 2 === 0 ? "bg-muted/30" : "",
                      )}
                    >
                      <span className="text-muted-foreground w-[130px] shrink-0 text-xs">
                        {label}
                      </span>
                      <span className="text-xs font-medium flex-1 break-words">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                {product.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Description (inline with Read More) ── */}
            {descriptionText && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Description</h3>
                  <div className="relative">
                    <p
                      className={cn(
                        "text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed",
                        !descriptionExpanded && isLongDescription && "line-clamp-4",
                      )}
                    >
                      {descriptionText}
                    </p>
                    {isLongDescription && (
                      <button
                        onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                        className="flex items-center gap-1 text-xs font-medium text-primary mt-1.5 hover:underline"
                      >
                        {descriptionExpanded ? (
                          <>
                            Read Less <ChevronUp className="h-3 w-3" />
                          </>
                        ) : (
                          <>
                            Read More <ChevronDown className="h-3 w-3" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            FULL-WIDTH SECTIONS (below the 2-col grid)
            ═══════════════════════════════════════════ */}


        {/* ── Similar Products (Sister Products) ── */}
        {product.sisterProducts && product.sisterProducts.length > 0 && (
          <div className="mt-10 md:mt-14">
            <Separator className="mb-6" />
            <h2 className="font-heading text-lg md:text-xl font-bold mb-4">
              Similar Products
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none -mx-3 px-3">
              {product.sisterProducts.map((sister) => {
                const imgUrl = getSisterCoverImage(sister);
                const sPrice = sister.minPricePaise ?? sister.basePricePaise ?? 0;
                const mPrice = sister.maxMrpPaise ?? sister.baseMrpPaise ?? 0;
                const disc =
                  mPrice > sPrice
                    ? Math.round(((mPrice - sPrice) / mPrice) * 100)
                    : 0;

                return (
                  <Link
                    key={sister._id}
                    href={`/products/${sister.slug}`}
                    className="shrink-0 w-[140px] md:w-[180px] group"
                  >
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted mb-2">
                      {imgUrl ? (
                        <Image
                          src={imgUrl}
                          alt={sister.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="180px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-2xl font-heading font-bold text-primary/20">
                            {sister.name[0]}
                          </span>
                        </div>
                      )}
                      {disc > 0 && (
                        <Badge className="absolute top-2 left-2 border-transparent bg-emerald-600 text-[9px] text-white">
                          {disc}% OFF
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {sister.name}
                    </p>
                    <p className="text-xs font-bold text-primary mt-0.5">
                      {formatPrice(sPrice)}
                      {disc > 0 && (
                        <span className="text-[10px] text-muted-foreground line-through ml-1.5">
                          {formatPrice(mPrice)}
                        </span>
                      )}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          STICKY BOTTOM BAR (mobile)
          ═══════════════════════════════════════════ */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border px-3 py-2.5 lg:hidden transition-transform duration-300",
          showStickyBar ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="flex items-center gap-2 max-w-7xl mx-auto">
          {/* Wishlist */}
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={() => toggleWishlist(product._id)}
            aria-label="Toggle wishlist"
          >
            <Heart
              className={cn(
                "h-5 w-5",
                wishlisted ? "fill-red-500 text-red-500" : "",
              )}
            />
          </Button>

          {/* Add to Cart */}
          <Button
            variant="outline"
            className="flex-1 h-11 text-sm font-semibold"
            onClick={handleAddToCart}
            disabled={addingToCart || !selectedSku}
          >
            <ShoppingBag className="mr-1.5 h-4 w-4 shrink-0" />
            {addingToCart ? "Adding..." : "Add to Cart"}
          </Button>

          {/* Buy Now */}
          <Button
            variant="default"
            className="flex-1 h-11 text-sm font-bold"
            onClick={handleBuyNow}
            disabled={!selectedSku}
          >
            Buy Now
          </Button>
        </div>
      </div>
    </>
  );
}
