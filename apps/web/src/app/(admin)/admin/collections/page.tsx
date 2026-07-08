"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, LayoutGrid, Eye, Sparkles, Hand, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { getMediaUrl } from "@/lib/media";
import type { ICollection } from "@/types";

export default function AdminCollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<ICollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchCollections() {
    setLoading(true);
    try {
      const res = await api.get<ICollection[]>("/api/v1/admin/collections");
      if (res.success && res.data) {
        setCollections(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCollections();
  }, []);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/api/v1/admin/collections/${deleteId}`);
      if (res.success) {
        toast.success("Collection deleted");
        setDeleteId(null);
        fetchCollections();
      } else {
        toast.error(res.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Collections</h1>
          <p className="mt-1 text-muted-foreground">
            Curate manual or automated product collections
          </p>
        </div>
        <Button variant="default" asChild>
          <Link href="/admin/collections/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Collection
          </Link>
        </Button>
      </div>

      {/* Collections Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" />
            All Collections ({collections.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Products</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Featured</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/20">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-md" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-12" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-8 w-20 ml-auto" /></td>
                      </tr>
                    ))
                  : collections.map((col) => (
                      <tr
                        key={col._id}
                        className="border-b border-border/20 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/collections/${col._id}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-8 w-8 rounded-md overflow-hidden bg-muted/50 border border-border/50 shrink-0 flex items-center justify-center">
                              {col.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={getMediaUrl(col.image)} alt={col.name} className="h-full w-full object-cover" />
                              ) : (
                                <LayoutGrid className="h-4 w-4 text-primary/50" />
                              )}
                            </div>
                            <span className="text-sm font-medium truncate max-w-[200px]">{col.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge variant="secondary" className="gap-1 text-[10px] capitalize">
                            {col.type === "automated" ? <Sparkles className="h-3 w-3" /> : <Hand className="h-3 w-3" />}
                            {col.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm hidden sm:table-cell">{col.productCount}</td>
                        <td className="px-4 py-3">
                          {col.isFeatured ? (
                            <Star className="h-4 w-4 fill-primary text-primary" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge tone={col.isActive ? "success" : "neutral"} className="text-[10px]">
                            {col.isActive ? "Active" : "Inactive"}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <Link href={`/admin/collections/${col._id}`}>
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <Link href={`/admin/collections/${col._id}/edit`}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeleteId(col._id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {!loading && collections.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No collections yet. Create your first one!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Collection"
        description="Are you sure? This removes the collection. Products are not affected."
        deleting={deleting}
      />
    </div>
  );
}
