"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { SlidersHorizontal, ChevronDown, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProductCard, type ProductCardProduct } from "@/components/shared/product-card";
import { Pagination } from "@/components/shared/pagination";
import { FilterSidebar } from "@/components/shared/filter-sidebar";
import { api } from "@/lib/api";
import type { ICategory, PaginatedResponse } from "@/types";

interface ProductWithSkus extends ProductCardProduct {
  skus?: Array<{ pricePaise: number; mrpPaise: number }>;
}

const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low → High", value: "price_asc" },
  { label: "Price: High → Low", value: "price_desc" },
  { label: "Rating", value: "rating" },
];

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<ICategory | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [products, setProducts] = useState<ProductWithSkus[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [inStockOnly, setInStockOnly] = useState(searchParams.get("inStock") === "true");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const categoryName =
    category?.name ||
    slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", "12");
      if (sortBy) qs.set("sortBy", sortBy);
      if (slug) {
        qs.set("categorySlug", slug);
      }
      if (minPrice) qs.set("minPricePaise", String(Number(minPrice) * 100));
      if (maxPrice) qs.set("maxPricePaise", String(Number(maxPrice) * 100));
      if (inStockOnly) qs.set("inStock", "true");


      const res = await api.get<PaginatedResponse<ProductWithSkus>>(`/api/v1/storefront/products?${qs.toString()}`);
      const data = res as unknown as PaginatedResponse<ProductWithSkus>;
      if (data.success && data.data) {
        setProducts(data.data);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotal(data.pagination?.total ?? 0);
      } else {
        setProducts([]);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, slug, minPrice, maxPrice, inStockOnly]);

  useEffect(() => {
    if (slug) {
      api.get<ICategory>(`/api/v1/storefront/categories/${slug}`)
        .then((res) => {
          if (res.success && res.data) {
            setCategory(res.data);
            setNotFound(false);
          } else {
            setNotFound(true);
          }
        })
        .catch(() => {
          setNotFound(true);
        });
    }
  }, [slug]);

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

  function handleApplyFilters(min: string, max: string, stock: boolean) {
    setMinPrice(min);
    setMaxPrice(max);
    setInStockOnly(stock);
    setPage(1);
    setMobileFilterOpen(false);
  }

  function handleClearFilters() {
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/categories" className="hover:text-foreground">Categories</Link>
        <span>/</span>
        <span className="text-foreground">{categoryName}</span>
      </nav>

      {notFound && !loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-heading text-lg font-semibold">Category not found</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            This category may have been removed or is no longer available.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/categories">Browse Categories</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading text-3xl md:text-4xl font-bold">{categoryName}</h1>
            {category?.description ? (
              <p className="mt-2 text-muted-foreground">{category.description}</p>
            ) : (
              <p className="mt-2 text-muted-foreground">
                Explore our curated collection of {categoryName.toLowerCase()}
              </p>
            )}
          </div>

          <div className="flex gap-8">
            {/* Filter Sidebar (Desktop) */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <FilterSidebar
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  inStockOnly={inStockOnly}
                  onApply={handleApplyFilters}
                  onClear={handleClearFilters}
                />
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
                  {/* Sort dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Sort <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {sortOptions.map((opt) => (
                        <DropdownMenuItem
                          key={opt.value}
                          onClick={() => handleSort(opt.value)}
                          className={sortBy === opt.value ? "text-primary" : ""}
                        >
                          {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Mobile filter trigger */}
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
              {(minPrice || maxPrice || inStockOnly) && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {(minPrice || maxPrice) && (
                    <Badge variant="secondary" className="gap-1">
                      ₹{minPrice || "0"} – ₹{maxPrice || "∞"}
                      <button
                        type="button"
                        onClick={() => { setMinPrice(""); setMaxPrice(""); setPage(1); }}
                        className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {inStockOnly && (
                    <Badge variant="secondary" className="gap-1">
                      In Stock
                      <button
                        type="button"
                        onClick={() => { setInStockOnly(false); setPage(1); }}
                        className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
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
                    Try adjusting your filters or search query to find what you&apos;re looking for.
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
        </>
      )}

      {/* Mobile Filter Sheet */}
      <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full gap-0 bg-background">
          <SheetHeader className="border-b px-6 py-4 flex flex-row items-center justify-between shrink-0">
            <SheetTitle className="text-lg font-semibold">Filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <FilterSidebar
              minPrice={minPrice}
              maxPrice={maxPrice}
              inStockOnly={inStockOnly}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
              isMobile={true}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
