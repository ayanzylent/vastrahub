"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Upload,
  Hand,
  Sparkles,
  Eye,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { getMediaUrl } from "@/lib/media";
import type {
  ICollection,
  ICategory,
  ICollectionRule,
  CollectionType,
  CollectionMatchMode,
} from "@/types";
import {
  CollectionProductPicker,
  type PickerProduct,
} from "@/components/admin/collections/collection-product-picker";
import { CollectionRuleBuilder } from "@/components/admin/collections/collection-rule-builder";

type MediaField = "image" | "bannerImage";

interface CollectionFormProps {
  /** Present when editing an existing collection. */
  collectionId?: string;
}

export function CollectionForm({ collectionId }: CollectionFormProps) {
  const router = useRouter();
  const isEditing = !!collectionId;

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CollectionType>("manual");
  const [image, setImage] = useState("");
  const [banner, setBanner] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [products, setProducts] = useState<PickerProduct[]>([]);
  const [rules, setRules] = useState<ICollectionRule[]>([]);
  const [matchMode, setMatchMode] = useState<CollectionMatchMode>("all");
  const [uploading, setUploading] = useState<MediaField | null>(null);

  // Live preview
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Load categories (for the "category" rule dropdown).
  useEffect(() => {
    api.get<ICategory[]>("/api/v1/admin/categories").then((res) => {
      if (res.success && res.data) setCategories(Array.isArray(res.data) ? res.data : []);
    });
  }, []);

  // Load the collection when editing.
  useEffect(() => {
    if (!collectionId) return;
    let cancelled = false;
    (async () => {
      const res = await api.get<ICollection>(`/api/v1/admin/collections/${collectionId}`);
      if (cancelled) return;
      if (res.success && res.data) {
        const col = res.data;
        setName(col.name);
        setDescription(col.description || "");
        setType(col.type);
        setImage(col.image || "");
        setBanner(col.bannerImage || "");
        setIsActive(col.isActive);
        setIsFeatured(col.isFeatured);
        setSortOrder(col.sortOrder ?? 0);
        setMetaTitle(col.metaTitle || "");
        setMetaDescription(col.metaDescription || "");
        setProductIds(col.productIds || []);
        setRules(col.rules || []);
        setMatchMode(col.matchMode || "all");

        if (col.type === "manual" && col.productIds?.length) {
          const pv = await api.get<{ data?: PickerProduct[] }>(
            `/api/v1/admin/collections/${collectionId}/preview?limit=200`,
          );
          const data = (pv as unknown as { data?: PickerProduct[] }).data ?? [];
          if (!cancelled && Array.isArray(data)) setProducts(data);
        }
      } else {
        toast.error("Collection not found");
        router.replace("/admin/collections");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [collectionId, router]);

  // Live preview: recompute resolved product count as the draft changes.
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    setPreviewLoading(true);
    const t = setTimeout(async () => {
      const res = await api.post<{ pagination?: { total?: number } }>(
        "/api/v1/admin/collections/preview",
        { type, productIds, rules, matchMode, page: 1, limit: 1 },
      );
      if (cancelled) return;
      const total = (res as unknown as { pagination?: { total?: number } }).pagination?.total;
      setPreviewCount(typeof total === "number" ? total : null);
      setPreviewLoading(false);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [loading, type, productIds, rules, matchMode]);

  async function handleMediaUpload(field: MediaField, file: File) {
    setUploading(field);
    try {
      const urlRes = await api.post<{ uploadUrl: string; key: string }>(
        "/api/v1/media/upload-url",
        {
          type: "image",
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          context: "collection",
        },
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
      if (field === "image") setImage(urlRes.data.key);
      else setBanner(urlRes.data.key);
      toast.success("Image uploaded!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Collection name is required");
      return;
    }
    if (type === "automated" && rules.length === 0) {
      toast.error("Add at least one condition for an automated collection");
      return;
    }
    if (type === "manual" && productIds.length === 0) {
      toast.error("Add at least one product to a manual collection");
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        type,
        description: description.trim() || undefined,
        image: image || undefined,
        bannerImage: banner || undefined,
        isActive,
        isFeatured,
        sortOrder,
        productIds: type === "manual" ? productIds : [],
        rules: type === "automated" ? rules : [],
        matchMode,
        metadata: {
          metaTitle: metaTitle.trim() || undefined,
          metaDescription: metaDescription.trim() || undefined,
        },
      };

      const res = isEditing
        ? await api.put(`/api/v1/admin/collections/${collectionId}`, body)
        : await api.post(`/api/v1/admin/collections`, body);

      if (res.success) {
        toast.success(isEditing ? "Collection updated" : "Collection created");
        router.push("/admin/collections");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save collection");
      }
    } catch {
      toast.error("Operation failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/collections">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold">
              {isEditing ? "Edit Collection" : "New Collection"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? "Update this collection’s details, products, or rules"
                : "Curate products manually or with automated rules"}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/collections">Cancel</Link>
          </Button>
          <Button variant="default" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Collection"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Diwali Festive Edit"
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description shown on the collection page"
                  rows={3}
                  maxLength={500}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                />
              </div>
            </CardContent>
          </Card>

          {/* Type + editor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Type selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("manual")}
                  className={`flex items-center gap-2 rounded-md border p-3 text-left text-sm transition-colors ${
                    type === "manual" ? "border-primary bg-primary/5" : "border-border/50 hover:bg-muted/30"
                  }`}
                >
                  <Hand className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="font-medium">Manual</div>
                    <div className="text-xs text-muted-foreground">Hand-pick &amp; order</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setType("automated")}
                  className={`flex items-center gap-2 rounded-md border p-3 text-left text-sm transition-colors ${
                    type === "automated" ? "border-primary bg-primary/5" : "border-border/50 hover:bg-muted/30"
                  }`}
                >
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="font-medium">Automated</div>
                    <div className="text-xs text-muted-foreground">Match products by rules</div>
                  </div>
                </button>
              </div>

              {/* Editor */}
              {type === "manual" ? (
                <CollectionProductPicker
                  productIds={productIds}
                  selectedProducts={products}
                  onChange={(ids, prods) => {
                    setProductIds(ids);
                    setProducts(prods);
                  }}
                />
              ) : (
                <CollectionRuleBuilder
                  rules={rules}
                  matchMode={matchMode}
                  categories={categories}
                  onChange={(r, m) => {
                    setRules(r);
                    setMatchMode(m);
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta-title">Meta Title</Label>
                <Input
                  id="meta-title"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Override page title (max 120 chars)"
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta-desc">Meta Description</Label>
                <Input
                  id="meta-desc"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Override meta description (max 320 chars)"
                  maxLength={320}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          {/* Live preview */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  {previewLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <Eye className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{previewCount ?? "—"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    product{previewCount === 1 ? "" : "s"} match
                    {type === "automated" ? " these rules" : " this selection"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Toggle
                id="active"
                checked={isActive}
                onChange={setIsActive}
                label="Active"
                desc="Visible on the storefront"
              />
              <Toggle
                id="featured"
                checked={isFeatured}
                onChange={setIsFeatured}
                label="Feature on homepage"
                desc="Show in the ‘Shop by Collection’ section"
              />
              <div className="space-y-2">
                <Label htmlFor="sort-order">Sort Order</Label>
                <Input
                  id="sort-order"
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Math.max(0, Number(e.target.value) || 0))}
                />
                <p className="text-xs text-muted-foreground">Lower numbers appear first.</p>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {(["image", "bannerImage"] as MediaField[]).map((field) => {
                const value = field === "image" ? image : banner;
                const label = field === "image" ? "Card Image" : "Banner Image";
                const hint =
                  field === "image" ? "Square-ish thumbnail for cards" : "Wide hero shown atop the page";
                const inputId = `collection-${field}-upload`;
                return (
                  <div className="space-y-2" key={field}>
                    <Label>{label}</Label>
                    {value ? (
                      <div className="relative overflow-hidden rounded-md border border-border/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getMediaUrl(value)}
                          alt={label}
                          className={`w-full object-cover ${field === "image" ? "aspect-square" : "aspect-[16/9]"}`}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={() => (field === "image" ? setImage("") : setBanner(""))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className={`flex flex-col items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20 ${
                          field === "image" ? "aspect-square" : "aspect-[16/9]"
                        }`}
                      >
                        <p className="text-xs text-muted-foreground px-3 text-center">{hint}</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id={inputId}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleMediaUpload(field, file);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={uploading === field}
                      onClick={() => document.getElementById(inputId)?.click()}
                    >
                      {uploading === field ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                      ) : (
                        <><Upload className="mr-2 h-4 w-4" /> {value ? "Replace" : "Upload"}</>
                      )}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky mobile action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex gap-3 border-t border-border bg-background/95 backdrop-blur px-4 py-3 sm:hidden">
        <Button variant="outline" className="flex-1" asChild>
          <Link href="/admin/collections">Cancel</Link>
        </Button>
        <Button variant="default" className="flex-1" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Save" : "Create"}
        </Button>
      </div>
    </div>
  );
}

// ─── Toggle switch ───────────────────────────────────────────────────────────

function Toggle({
  id,
  checked,
  onChange,
  label,
  desc,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc: string;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer">
      <div className="relative mt-0.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors" />
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-background rounded-full shadow transition-transform peer-checked:translate-x-4" />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </label>
  );
}
