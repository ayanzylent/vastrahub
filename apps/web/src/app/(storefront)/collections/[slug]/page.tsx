"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { SlidersHorizontal, ChevronDown, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProductCard, type ProductCardProduct } from "@/components/shared/product-card";
import { Pagination } from "@/components/shared/pagination";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/media";
import type { ICollection } from "@vastrahub/shared-types";

interface ProductWithSkus extends ProductCardProduct {
  skus?: Array<{ pricePaise: number; mrpPaise: number }>;
}

/** Response shape for GET /storefront/collections/:slug */
interface CollectionProductsResponse {
  success: boolean;
  data?: ICollection;
  products?: ProductWithSkus[];
  pagination?: { totalPages: number; total: number };
}

const sortOptions = [
  { label: "Curated", value: "" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low → High", value: "price_asc" },
  { label: "Price: High → Low", value: "price_desc" },
  { label: "Rating", value: "rating" },
];

export default function CollectionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [collection, setCollection] = useState<ICollection | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [products, setProducts] = useState<ProductWithSkus[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [inStockOnly, setInStockOnly] = useState(searchParams.get("inStock") === "true");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const collectionName =
    collection?.name ||
    slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", "12");
      if (sortBy) qs.set("sortBy", sortBy);
      if (minPrice) qs.set("minPricePaise", String(Number(minPrice) * 100));
      if (maxPrice) qs.set("maxPricePaise", String(Number(maxPrice) * 100));
      if (inStockOnly) qs.set("inStock", "true");
      if (search) qs.set("search", search);

      const res = await api.get<ICollection>(
        `/api/v1/storefront/collections/${slug}?${qs.toString()}`,
      );
      const data = res as unknown as CollectionProductsResponse;
      if (data.success && data.data) {
        setCollection(data.data);
        setProducts(data.products ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotal(data.pagination?.total ?? 0);
      } else {
        setNotFound(true);
        setProducts([]);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, slug, minPrice, maxPrice, inStockOnly, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function handlePageChange(newPage: number) {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSort(value: string) {
    setSortBy(value);
    setPage(1);
  }

  function handleApplyFilters() {
    setPage(1);
    setMobileFilterOpen(false);
    fetchProducts();
  }

  function handleClearFilters() {
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setSearch("");
    setPage(1);
  }

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </h2>
        <button className="text-xs text-primary hover:underline" onClick={handleClearFilters}>
          Clear All
        </button>
      </div>

      <Separator />

      <div>
        <Label className="text-sm font-medium mb-2 block">Search</Label>
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm"
        />
      </div>

      <Separator />

      <div>
        <Label className="text-sm font-medium mb-3 block">Price Range (₹)</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="text-sm"
          />
          <span className="flex items-center text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="text-sm"
          />
        </div>
      </div>

      <Separator />

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => setInStockOnly(e.target.checked)}
          className="rounded border-border bg-transparent text-primary focus:ring-primary/20"
        />
        <span className="text-sm">In Stock Only</span>
      </label>

      <Button variant="default" className="w-full" onClick={handleApplyFilters}>
        Apply Filters
      </Button>
    </div>
  );

  const bannerImage = collection?.bannerImage || collection?.image;

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/collections" className="hover:text-foreground">Collections</Link>
        <span>/</span>
        <span className="text-foreground">{collectionName}</span>
      </nav>

      {/* Banner / Header */}
      {bannerImage ? (
        <div className="relative mb-8 overflow-hidden rounded-2xl">
          <div className="aspect-[21/9] w-full md:aspect-[3/1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getMediaUrl(bannerImage)} alt={collectionName} className="h-full w-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 md:p-8">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-white">{collectionName}</h1>
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
      )}

      {notFound && !loading ? (
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
      ) : (
        <div className="flex gap-8">
          {/* Filter Sidebar (Desktop) */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <FilterContent />
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {loading ? (
                  <Skeleton className="h-4 w-32 inline-block" />
                ) : (
                  <>
                    Showing <span className="font-medium text-foreground">{total}</span> products
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Sort <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {sortOptions.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value || "curated"}
                        onClick={() => handleSort(opt.value)}
                        className={sortBy === opt.value ? "text-primary" : ""}
                      >
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setMobileFilterOpen(true)}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-1" />
                  Filters
                </Button>
              </div>
            </div>

            {/* Active filters */}
            {(minPrice || maxPrice || inStockOnly || search) && (
              <div className="mb-4 flex flex-wrap gap-2">
                {search && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {search}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => { setSearch(""); setPage(1); }} />
                  </Badge>
                )}
                {(minPrice || maxPrice) && (
                  <Badge variant="secondary" className="gap-1">
                    ₹{minPrice || "0"} – ₹{maxPrice || "∞"}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => { setMinPrice(""); setMaxPrice(""); setPage(1); }} />
                  </Badge>
                )}
                {inStockOnly && (
                  <Badge variant="secondary" className="gap-1">
                    In Stock
                    <X className="h-3 w-3 cursor-pointer" onClick={() => { setInStockOnly(false); setPage(1); }} />
                  </Badge>
                )}
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-0">
                      <Skeleton className="aspect-[3/4] w-full rounded-none" />
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <div className="flex items-center justify-between pt-1">
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-5 w-12" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold">No products found</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                  Try adjusting your filters to find what you&apos;re looking for.
                </p>
                <Button variant="outline" className="mt-4" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    lowestPricePaise={product.skus?.[0]?.pricePaise ?? product.basePricePaise}
                    lowestMrpPaise={product.skus?.[0]?.mrpPaise ?? product.baseMrpPaise}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-10">
                <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Filter Sheet */}
      <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <SheetContent side="left" className="w-[300px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
