"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, FolderTree, Upload, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { getMediaUrl } from "@/lib/media";
import { ICategory } from "@vastrahub/shared-types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [viewingCategory, setViewingCategory] = useState<ICategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formParentId, setFormParentId] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formImage, setFormImage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await api.get<ICategory[]>("/api/v1/admin/categories");
      if (res.success && res.data) {
        const cats = Array.isArray(res.data) ? res.data : [];
        setCategories(cats);
        console.log(cats)
      }
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  function openAddDialog() {
    setEditingCategory(null);
    setFormName("");
    setFormDescription("");
    setFormParentId("");
    setFormIsActive(true);
    setFormImage("");
    setDialogOpen(true);
  }

  function openEditDialog(cat: ICategory) {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || "");
    setFormParentId(cat.parentId || "");
    setFormIsActive(cat.isActive);
    setFormImage(cat.image || "");
    setDialogOpen(true);
  }

  async function handleMediaUpload(file: File) {
    setUploading(true);
    try {
      const urlRes = await api.post<{ uploadUrl: string; publicUrl: string; key: string }>(
        "/api/v1/media/upload-url",
        {
          type: file.type.startsWith("video") ? "video" : "image",
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          context: "category",
        }
      );
      if (!urlRes.success || !urlRes.data) {
        toast.error("Failed to get upload URL");
        return;
      }

      const uploadRes = await fetch(urlRes.data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) {
        toast.error("Upload failed");
        return;
      }

      setFormImage(urlRes.data.key);
      toast.success("Image uploaded!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!formName.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: formName,
        description: formDescription || undefined,
        parentId: formParentId || null,
        isActive: formIsActive,
        image: formImage || undefined,
      };

      if (editingCategory) {
        const res = await api.put(`/api/v1/admin/categories/${editingCategory._id}`, body);
        if (res.success) {
          toast.success("Category updated");
          setDialogOpen(false);
          fetchCategories();
        } else {
          toast.error(res.error || "Failed to update");
        }
      } else {
        const res = await api.post(`/api/v1/admin/categories`, body);
        if (res.success) {
          toast.success("Category created");
          setDialogOpen(false);
          fetchCategories();
        } else {
          toast.error(res.error || "Failed to create");
        }
      }
    } catch {
      toast.error("Operation failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setSaving(true);
    try {
      const res = await api.delete(`/api/v1/admin/categories/${deleteId}`);
      if (res.success) {
        toast.success("Category deleted");
        setDeleteId(null);
        fetchCategories();
      } else {
        toast.error(res.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setSaving(false);
    }
  }

  function getParentName(parentId: string | null | undefined): string {
    if (!parentId) return "—";
    const parent = categories.find((c) => c._id === parentId);
    return parent?.name || "—";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Categories</h1>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">
            Manage your product categories
          </p>
        </div>
        <Button variant="brand" onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-brand-400" />
            All Categories ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]/40">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider hidden md:table-cell">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider hidden sm:table-cell">
                    Parent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[hsl(var(--border))]/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-md animate-pulse" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-8 w-20 ml-auto" /></td>
                    </tr>
                  ))
                  : categories.map((cat) => (
                    <tr
                      key={cat._id}
                      className="border-b border-[hsl(var(--border))]/20 hover:bg-[hsl(var(--muted))]/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {cat.ancestors?.length > 0 && (
                            <span className="text-[hsl(var(--muted-foreground))] whitespace-pre shrink-0">
                              {"  ".repeat(cat.ancestors.length)}↳{" "}
                            </span>
                          )}
                          <div className="relative h-8 w-8 rounded-md overflow-hidden bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]/50 shrink-0 flex items-center justify-center">
                            {cat.image ? (
                              <img
                                src={getMediaUrl(cat.image)}
                                alt={cat.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <FolderTree className="h-4 w-4 text-brand-400/50" />
                            )}
                          </div>
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {cat.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))] hidden md:table-cell font-mono text-xs">
                        {cat.slug}
                      </td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))] hidden sm:table-cell">
                        {getParentName(cat.parentId)}
                      </td>
                      <td className="px-4 py-3 text-sm">{cat.productCount}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={cat.isActive ? "success" : "secondary"}
                          className="text-[10px]"
                        >
                          {cat.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewingCategory(cat)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(cat)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400"
                            onClick={() => setDeleteId(cat._id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!loading && categories.length === 0 && (
              <div className="py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
                No categories yet. Create your first one!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? "Update category details" : "Create a new product category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Sarees"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
            <div className="space-y-2">
              <Label>Category Image</Label>
              <div className="flex items-center gap-4">
                {formImage && (
                  <div className="h-16 w-16 rounded-md overflow-hidden bg-[hsl(var(--muted))]/50 flex-shrink-0 border border-[hsl(var(--border))]/50">
                    <img src={getMediaUrl(formImage)} alt="Category" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="category-image-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleMediaUpload(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => document.getElementById("category-image-upload")?.click()}
                  >
                    {uploading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="mr-2 h-4 w-4" /> {formImage ? "Change Image" : "Upload Image"}</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <select
                value={formParentId}
                onChange={(e) => setFormParentId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
              >
                <option value="">None (Top Level)</option>
                {categories
                  .filter((c) => c._id !== editingCategory?._id)
                  .map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Active</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="brand" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingCategory} onOpenChange={() => setViewingCategory(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Category Details</DialogTitle>
          </DialogHeader>
          {viewingCategory && (
            <div className="space-y-6">
              {/* Image & Main Info */}
              <div className="flex items-start gap-4">
                <div className="h-24 w-24 rounded-lg overflow-hidden bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]/50 flex-shrink-0 flex items-center justify-center">
                  {viewingCategory.image ? (
                    <img
                      src={getMediaUrl(viewingCategory.image)}
                      alt={viewingCategory.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FolderTree className="h-12 w-12 text-brand-400/30" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading text-lg font-bold">{viewingCategory.name}</h3>
                  <p className="font-mono text-xs text-[hsl(var(--muted-foreground))] break-all">
                    Slug: {viewingCategory.slug}
                  </p>
                  <div className="pt-1">
                    <Badge variant={viewingCategory.isActive ? "success" : "secondary"}>
                      {viewingCategory.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-3 border-t border-[hsl(var(--border))]/40 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Parent Category:</span>
                  <span className="font-medium">{getParentName(viewingCategory.parentId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Products Count:</span>
                  <span className="font-medium">{viewingCategory.productCount}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[hsl(var(--muted-foreground))]">Description:</span>
                  <p className="text-[hsl(var(--foreground))]/90 bg-[hsl(var(--muted))]/30 rounded-md p-3 text-xs leading-relaxed min-h-[60px] whitespace-pre-wrap break-words">
                    {viewingCategory.description || "No description provided."}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingCategory(null)}>
              Close
            </Button>
            {viewingCategory && (
              <Button
                variant="brand"
                onClick={() => {
                  const cat = viewingCategory;
                  setViewingCategory(null);
                  openEditDialog(cat);
                }}
              >
                Edit Category
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        description="Are you sure? This will remove the category. Products in this category will need to be reassigned."
        deleting={saving}
      />
    </div>
  );
}
