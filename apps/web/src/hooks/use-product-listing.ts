"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { parseColorFilterParam } from "@/lib/color-filters";
import type { ProductCardProduct } from "@/components/storefront/catalog/product-card";

export interface ProductWithSkus extends ProductCardProduct {
  skus?: Array<{ pricePaise: number; mrpPaise: number }>;
}

export interface ListingFetchContext {
  page: number;
  sortBy: string;
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
  selectedColors: string[];
  search: string;
  params: URLSearchParams;
}

export interface ListingFetchResult {
  products: ProductWithSkus[];
  total: number;
  totalPages: number;
}

interface UseProductListingOptions {
  defaultSort?: string;
  includeSearch?: boolean;
  fetchPage: (ctx: ListingFetchContext) => Promise<ListingFetchResult>;
}

export function useProductListing({
  defaultSort = "newest",
  includeSearch = false,
  fetchPage,
}: UseProductListingOptions) {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<ProductWithSkus[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || defaultSort);
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [inStockOnly, setInStockOnly] = useState(searchParams.get("inStock") === "true");
  const [selectedColors, setSelectedColors] = useState<string[]>(() =>
    parseColorFilterParam(searchParams.get("colors") || searchParams.get("tags")),
  );
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const search = includeSearch ? searchParams.get("search") || "" : "";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "12");
      if (sortBy) params.set("sortBy", sortBy);
      if (minPrice) params.set("minPricePaise", String(Number(minPrice) * 100));
      if (maxPrice) params.set("maxPricePaise", String(Number(maxPrice) * 100));
      if (inStockOnly) params.set("inStock", "true");
      if (selectedColors.length > 0) params.set("tags", selectedColors.join(","));
      if (search) params.set("search", search);

      const result = await fetchPage({
        page,
        sortBy,
        minPrice,
        maxPrice,
        inStockOnly,
        selectedColors,
        search,
        params,
      });
      setProducts(result.products);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch {
      setProducts([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, minPrice, maxPrice, inStockOnly, selectedColors, search, fetchPage]);

  useEffect(() => {
    load();
  }, [load]);

  function handlePageChange(newPage: number) {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSort(value: string) {
    setSortBy(value);
    setPage(1);
  }

  function handleApplyFilters(min: string, max: string, stock: boolean, colors: string[]) {
    setMinPrice(min);
    setMaxPrice(max);
    setInStockOnly(stock);
    setSelectedColors(colors);
    setPage(1);
    setMobileFilterOpen(false);
  }

  function handleClearFilters() {
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setSelectedColors([]);
    setPage(1);
  }

  function removeColor(color: string) {
    setSelectedColors((prev) => prev.filter((c) => c !== color));
    setPage(1);
  }

  function clearPrice() {
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  }

  function clearInStock() {
    setInStockOnly(false);
    setPage(1);
  }

  return {
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
    search,
    handlePageChange,
    handleSort,
    handleApplyFilters,
    handleClearFilters,
    removeColor,
    clearPrice,
    clearInStock,
  };
}

export type ProductListingState = ReturnType<typeof useProductListing>;
