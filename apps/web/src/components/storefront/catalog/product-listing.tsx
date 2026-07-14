"use client";

import type { ReactNode } from "react";
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
import { ProductCard } from "@/components/storefront/catalog/product-card";
import { Pagination } from "@/components/common/pagination";
import { FilterSidebar } from "@/components/storefront/catalog/filter-sidebar";
import type { ProductListingState } from "@/hooks/use-product-listing";

export const DEFAULT_SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low → High", value: "price_asc" },
  { label: "Price: High → Low", value: "price_desc" },
  { label: "Rating", value: "rating" },
];

export const COLLECTION_SORT_OPTIONS = [
  { label: "Curated", value: "" },
  ...DEFAULT_SORT_OPTIONS,
];

interface ProductListingProps {
  listing: ProductListingState;
  breadcrumb: ReactNode;
  header: ReactNode;
  sortOptions?: Array<{ label: string; value: string }>;
  emptyMessage?: string;
  /** When true, hide the product grid area (e.g. entity not found). */
  hideGrid?: boolean;
  notFoundContent?: ReactNode;
}

export function ProductListing({
  listing,
  breadcrumb,
  header,
  sortOptions = DEFAULT_SORT_OPTIONS,
  emptyMessage = "Try adjusting your filters or search query to find what you're looking for.",
  hideGrid = false,
  notFoundContent,
}: ProductListingProps) {
  const {
    products,
    loading,
    page,
    totalPages,
    total,
    sortBy,
    minPrice,
    maxPrice,
    inStockOnly,
    selectedColors,
    mobileFilterOpen,
    setMobileFilterOpen,
    handlePageChange,
    handleSort,
    handleApplyFilters,
    handleClearFilters,
    removeColor,
    clearPrice,
    clearInStock,
  } = listing;

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      {breadcrumb}

      {notFoundContent}

      {!hideGrid && (
        <>
          {header}

          <div className="flex gap-8">
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <FilterSidebar
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  inStockOnly={inStockOnly}
                  selectedColors={selectedColors}
                  onApply={handleApplyFilters}
                  onClear={handleClearFilters}
                />
              </div>
            </aside>

            <div className="flex-1">
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

              {(minPrice || maxPrice || inStockOnly || selectedColors.length > 0) && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {(minPrice || maxPrice) && (
                    <Badge variant="secondary" className="gap-1">
                      ₹{minPrice || "0"} – ₹{maxPrice || "∞"}
                      <button
                        type="button"
                        onClick={clearPrice}
                        className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedColors.map((color) => (
                    <Badge key={color} variant="secondary" className="gap-1">
                      {color}
                      <button
                        type="button"
                        onClick={() => removeColor(color)}
                        className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {inStockOnly && (
                    <Badge variant="secondary" className="gap-1">
                      In Stock
                      <button
                        type="button"
                        onClick={clearInStock}
                        className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}

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
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm">{emptyMessage}</p>
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

              {!loading && totalPages > 1 && (
                <div className="mt-10">
                  <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>
              )}
            </div>
          </div>
        </>
      )}

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
              selectedColors={selectedColors}
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
