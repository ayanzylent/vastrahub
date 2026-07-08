"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { Pagination } from "@/components/shared/pagination";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { getMediaUrl } from "@/lib/media";
import { toast } from "sonner";
import type { IProduct, PaginatedResponse } from "@/types";

interface AdminProduct extends IProduct {
  category?: { name: string };
  lowestPricePaise?: number;
  coverImageUrl?: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      if (search) params.set("search", search);

      const res = await api.get<PaginatedResponse<AdminProduct>>(
        `/api/v1/admin/products?${params.toString()}`
      );
      const data = res as unknown as PaginatedResponse<AdminProduct>;
      if (data.success && data.data) {
        console.log(data.data)
        setProducts(data.data);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotal(data.pagination?.total ?? 0);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/api/v1/admin/products/${deleteId}`);
      if (res.success) {
        toast.success("Product deleted");
        setDeleteId(null);
        fetchProducts();
      } else {
        toast.error(res.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  function getCoverImage(product: AdminProduct): string | null {
    if (product.coverImageUrl) return getMediaUrl(product.coverImageUrl);
    const coverGroup = product.variantMedia?.find((vm) => vm.isCoverGroup);
    const group = coverGroup || product.variantMedia?.[0];
    if (!group?.media?.length) return null;
    const url = group.media.find((m) => m.type === "image")?.url || null;
    return url ? getMediaUrl(url) : null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Products</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <Button variant="default" asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Products ({total})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Published
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-12" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-8 w-8 ml-auto" /></td>
                    </tr>
                  ))
                  : products.map((product) => {
                    const coverImg = getCoverImage(product);
                    return (
                      <tr
                        key={product._id}
                        className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
                              {coverImg ? (
                                <Image src={coverImg} alt={product.name} fill className="object-cover" sizes="40px" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-primary/30 text-sm font-bold">
                                  {product.name[0]}
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-medium truncate max-w-[200px]">
                              {product.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                          {product.category?.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {product.basePricePaise ? formatPrice(product.basePricePaise) : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm hidden sm:table-cell">
                          <span className={product.totalStock === 0 ? "text-destructive" : ""}>
                            {product.totalStock ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            tone={product.publishedAt ? "success" : "neutral"}
                            className="text-[10px]"
                          >
                            {product.publishedAt ? "Yes" : "No"}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            tone={product.isActive ? "success" : "warning"}
                            className="text-[10px]"
                          >
                            {product.isActive ? "Active" : "Draft"}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/products/${product.slug}`}>
                                  <Eye className="h-4 w-4 mr-2" /> View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/products/${product._id}/edit`}>
                                  <Pencil className="h-4 w-4 mr-2" /> Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteId(product._id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {!loading && products.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No products found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        deleting={deleting}
      />
    </div>
  );
}
