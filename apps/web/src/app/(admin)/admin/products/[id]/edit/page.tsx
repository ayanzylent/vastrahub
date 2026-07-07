"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Plus,
  X,
  Trash2,
  Pencil,
  AlertTriangle,
  CheckCircle2,
  Globe,
  EyeOff,
  Package,
  Image as ImageIcon,
  RefreshCw,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { SkuFormSheet } from "@/components/admin/sku-form-sheet";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { getMediaUrl } from "@/lib/media";
import type { IProduct, ISku, ICategory, IVariantOption } from "@vastrahub/shared-types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductWithSkus extends IProduct {
  skus?: ISku[];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EditProductPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.id as string;

  // Determine initial tab from URL
  const initialTab = searchParams.get("tab") ?? "details";

  const [product, setProduct] = useState<ProductWithSkus | null>(null);
  const [skus, setSkus] = useState<ISku[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // ── Product form fields ────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [styleCode, setStyleCode] = useState("");
  const [gstPercentage, setGstPercentage] = useState("5");
  const [hsn, setHsn] = useState("");
  const [material, setMaterial] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // ── SEO fields ────────────────────────────────────────────────────────────
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [slugSaving, setSlugSaving] = useState(false);

  // ── Variant + Media state ─────────────────────────────────────────────────
  const [variantOptions, setVariantOptions] = useState<IVariantOption[]>([]);
  const [visualAttributeName, setVisualAttributeName] = useState("");
  const [showVisualSelector, setShowVisualSelector] = useState(true);
  const [variantMedia, setVariantMedia] = useState<
    Array<{
      variantValue: string;
      variantLabel: string;
      variantSlug: string;
      isCoverGroup: boolean;
      media: Array<{
        type: "image" | "video";
        url: string;
        alt: string;
        sortOrder: number;
        mimeType: string;
      }>;
    }>
  >([]);
  const [uploadingGroupIdx, setUploadingGroupIdx] = useState<number | null>(null);

  // ── SKU management ────────────────────────────────────────────────────────
  const [skuSheetOpen, setSkuSheetOpen] = useState(false);
  const [editingSku, setEditingSku] = useState<ISku | null>(null);
  const [deletingSkuId, setDeletingSkuId] = useState<string | null>(null);
  const [deletingConfirm, setDeletingConfirm] = useState(false);
  const [stockEditing, setStockEditing] = useState<Record<string, string>>({});

  // ─── Load data ──────────────────────────────────────────────────────────

  const loadProduct = useCallback(async () => {
    const [prodRes, catRes] = await Promise.all([
      api.get<ProductWithSkus>(`/api/v1/admin/products/${productId}`),
      api.get<ICategory[]>("/api/v1/storefront/categories"),
    ]);

    if (catRes.success && catRes.data) {
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
    }

    if (prodRes.success && prodRes.data) {
      const p = prodRes.data;
      setProduct(p);
      setName(p.name ?? "");
      setDescription(p.description ?? "");
      setShortDescription(p.shortDescription ?? "");
      setCategoryId(String(p.categoryId ?? ""));
      setBrand(p.brand ?? "");
      setTags(p.tags ?? []);
      setStyleCode(p.styleCode ?? "");
      setGstPercentage(String(p.gstPercentage ?? 5));
      setHsn(p.hsn ?? "");
      setMaterial(p.material ?? "");
      setCareInstructions(p.careInstructions ?? "");
      setIsFeatured(p.isFeatured ?? false);
      setIsActive(p.isActive ?? true);
      setMetaTitle(p.metadata?.metaTitle ?? "");
      setMetaDescription(
        p.metadata?.metaDescription ?? ""
      );
      setNewSlug(p.slug ?? "");
      setVariantOptions(p.variantOptions ?? []);
      setVisualAttributeName(p.visualAttributeName ?? "");
      setShowVisualSelector(p.showVisualSelector ?? true);
      setVariantMedia(
        (p.variantMedia ?? []).map((g) => ({
          variantValue: g.variantValue ?? "",
          variantLabel: g.variantLabel ?? "",
          variantSlug: g.variantSlug ?? "",
          isCoverGroup: g.isCoverGroup ?? false,
          media: (g.media ?? []).map((m) => ({
            type: m.type as "image" | "video",
            url: m.url ?? "",
            alt: m.alt ?? "",
            sortOrder: m.sortOrder ?? 0,
            mimeType: m.mimeType ?? "image/jpeg",
          })),
        }))
      );
      if (p.skus) setSkus(p.skus);
    }
  }, [productId]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadProduct();
      setLoading(false);
    }
    init();
  }, [loadProduct]);

  useEffect(() => {
    if (!visualAttributeName) return;
    const visualOption = variantOptions.find(opt => opt.name === visualAttributeName);
    if (!visualOption || visualOption.values.length === 0) return;

    setVariantMedia((prev) => {
      return visualOption.values.map((val, i) => {
        const existing = prev.find((m) => m.variantValue === val.value);
        return (
          existing ?? {
            variantValue: val.value,
            variantLabel: val.label || val.value,
            variantSlug: val.slug || slugify(val.value),
            isCoverGroup: i === 0 && !prev.some((m) => m.isCoverGroup),
            media: [],
          }
        );
      });
    });
  }, [visualAttributeName, variantOptions]);

  const refreshSkus = async () => {
    const res = await api.get<ProductWithSkus>(`/api/v1/admin/products/${productId}`);
    if (res.success && res.data?.skus) {
      setSkus(res.data.skus);
      setProduct((prev) =>
        prev ? { ...prev, totalStock: res.data!.totalStock, skuCount: res.data!.skuCount, basePricePaise: res.data!.basePricePaise } : prev
      );
    }
  };

  // ─── Save product details ───────────────────────────────────────────────

  async function handleSaveDetails() {
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim() || undefined,
        categoryId,
        brand: brand.trim() || undefined,
        tags,
        styleCode: styleCode.trim() || undefined,
        gstPercentage: Number(gstPercentage),
        hsn: hsn.trim() || undefined,
        material: material.trim() || undefined,
        careInstructions: careInstructions.trim() || undefined,
        isFeatured,
        isActive,
      };
      const res = await api.put(`/api/v1/admin/products/${productId}`, body);
      if (res.success) {
        toast.success("Product details saved");
        setProduct((p) => (p ? { ...p, ...body } : p));
      } else {
        toast.error(res.error ?? "Failed to save");
      }
    } catch {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  // ─── Save variants & media ──────────────────────────────────────────────

  async function handleSaveVariants() {
    const coverCount = variantMedia.filter((g) => g.isCoverGroup).length;
    if (variantMedia.length > 0 && coverCount !== 1) {
      toast.error("Exactly one media group must be marked as Cover");
      return;
    }
    setSaving(true);
    try {
      const body = {
        variantOptions: variantOptions.map((opt) => ({
          name: opt.name,
          type: "select",
          values: opt.values,
        })),
        visualAttributeName: visualAttributeName || undefined,
        showVisualSelector,
        variantMedia: variantMedia.map((g) => ({
          variantValue: g.variantValue,
          variantLabel: g.variantLabel,
          variantSlug: g.variantSlug,
          isCoverGroup: g.isCoverGroup,
          media: g.media.filter((m) => m.url.trim()),
        })),
      };
      const res = await api.put(`/api/v1/admin/products/${productId}`, body);
      if (res.success) {
        toast.success("Variants & media saved");
        await loadProduct();
      } else {
        toast.error(res.error ?? "Failed to save");
      }
    } catch {
      toast.error("Failed to save variants");
    } finally {
      setSaving(false);
    }
  }

  // ─── Save SEO ───────────────────────────────────────────────────────────

  async function handleSaveSeo() {
    setSaving(true);
    try {
      const body = {
        metadata: {
          metaTitle: metaTitle.trim() || undefined,
          metaDescription: metaDescription.trim() || undefined,
        },
      };
      const res = await api.put(`/api/v1/admin/products/${productId}`, body);
      if (res.success) {
        toast.success("SEO settings saved");
      } else {
        toast.error(res.error ?? "Failed to save");
      }
    } catch {
      toast.error("Failed to save SEO");
    } finally {
      setSaving(false);
    }
  }

  // ─── Slug management ────────────────────────────────────────────────────

  async function handleSetSlug() {
    if (!newSlug.trim()) return;
    setSlugSaving(true);
    try {
      const res = await api.put(
        `/api/v1/admin/products/${productId}/slug`,
        { slug: newSlug.trim() }
      );
      if (res.success) {
        toast.success("Slug updated");
        setProduct((p) => (p ? { ...p, slug: newSlug.trim() } : p));
      } else {
        toast.error(res.error ?? "Failed to update slug");
      }
    } catch {
      toast.error("Failed to update slug");
    } finally {
      setSlugSaving(false);
    }
  }

  async function handleAutoSlug() {
    setSlugSaving(true);
    try {
      const res = await api.put<{ slug: string }>(
        `/api/v1/admin/products/${productId}/slug/auto`,
        {}
      );
      if (res.success && res.data) {
        toast.success("Slug auto-generated");
        setNewSlug(res.data.slug ?? "");
        setProduct((p) => (p ? { ...p, slug: res.data!.slug } : p));
      } else {
        toast.error(res.error ?? "Failed");
      }
    } catch {
      toast.error("Failed to auto-generate slug");
    } finally {
      setSlugSaving(false);
    }
  }

  // ─── Publish / Unpublish ────────────────────────────────────────────────

  async function handlePublish() {
    setPublishing(true);
    try {
      const res = await api.post(`/api/v1/admin/products/${productId}/publish`, {});
      if (res.success) {
        toast.success("Product published! 🎉");
        setProduct((p) => (p ? { ...p, publishedAt: new Date() } : p));
      } else {
        toast.error(res.error ?? "Failed to publish");
      }
    } catch {
      toast.error("Failed to publish");
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    setPublishing(true);
    try {
      const res = await api.post(`/api/v1/admin/products/${productId}/unpublish`, {});
      if (res.success) {
        toast.success("Product unpublished");
        setProduct((p) => (p ? { ...p, publishedAt: null } : p));
      } else {
        toast.error(res.error ?? "Failed to unpublish");
      }
    } catch {
      toast.error("Failed to unpublish");
    } finally {
      setPublishing(false);
    }
  }

  // ─── SKU actions ────────────────────────────────────────────────────────

  async function handleDeleteSku() {
    if (!deletingSkuId) return;
    try {
      const res = await api.delete(`/api/v1/admin/skus/${deletingSkuId}`);
      if (res.success) {
        toast.success("SKU deleted");
        setDeletingConfirm(false);
        setDeletingSkuId(null);
        await refreshSkus();
      } else {
        toast.error(res.error ?? "Failed to delete SKU");
      }
    } catch {
      toast.error("Failed to delete SKU");
    }
  }

  async function handleStockSave(skuId: string) {
    const qty = parseInt(stockEditing[skuId] ?? "0");
    if (isNaN(qty) || qty < 0) {
      toast.error("Stock must be a non-negative number");
      return;
    }
    try {
      const res = await api.put(`/api/v1/admin/skus/${skuId}/stock`, {
        quantity: qty,
      });
      if (res.success) {
        toast.success("Stock updated");
        setStockEditing((prev) => {
          const next = { ...prev };
          delete next[skuId];
          return next;
        });
        await refreshSkus();
      } else {
        toast.error(res.error ?? "Failed to update stock");
      }
    } catch {
      toast.error("Failed to update stock");
    }
  }

  // ─── Variant helpers ────────────────────────────────────────────────────

  function addVariantOption() {
    setVariantOptions([
      ...variantOptions,
      { name: "", type: "select", values: [] } as IVariantOption,
    ]);
  }

  function updateOptionName(i: number, name: string) {
    const oldName = variantOptions[i].name;
    const next = [...variantOptions];
    next[i] = { ...next[i], name };
    setVariantOptions(next);
    if (visualAttributeName === oldName && oldName !== "") {
      setVisualAttributeName(name);
    }
  }

  function addOptionValue(i: number, rawVal: string) {
    if (!rawVal.trim()) return;
    const next = [...variantOptions];
    const slug = slugify(rawVal.trim());
    if (!next[i].values.find((v) => v.value === rawVal.trim().toLowerCase())) {
      next[i] = {
        ...next[i],
        values: [
          ...next[i].values,
          { value: rawVal.trim().toLowerCase(), label: rawVal.trim(), slug },
        ],
      };
      setVariantOptions(next);
    }
  }

  function removeOptionValue(optIdx: number, valIdx: number) {
    const next = [...variantOptions];
    next[optIdx] = {
      ...next[optIdx],
      values: next[optIdx].values.filter((_, vi) => vi !== valIdx),
    };
    setVariantOptions(next);
  }

  function removeOption(i: number) {
    const opt = variantOptions[i];
    if (visualAttributeName === opt.name) setVisualAttributeName("");
    setVariantOptions(variantOptions.filter((_, idx) => idx !== i));
  }

  function setCoverGroup(gi: number) {
    setVariantMedia((prev) =>
      prev.map((g, i) => ({ ...g, isCoverGroup: i === gi }))
    );
  }

  async function handleMediaUpload(groupIdx: number, files: FileList) {
    setUploadingGroupIdx(groupIdx);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith("video/");
        const type = isVideo ? "video" : "image";

        const urlRes = await api.post<{ uploadUrl: string; key: string }>(
          "/api/v1/media/upload-url",
          {
            type,
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
            context: "product",
          }
        );

        const uploadData = urlRes.data;
        if (!urlRes.success || !uploadData) {
          toast.error(`Failed to get upload URL for ${file.name}`);
          continue;
        }

        const uploadRes = await fetch(uploadData.uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadRes.ok) {
          toast.error(`Upload failed for ${file.name}`);
          continue;
        }

        setVariantMedia((prev) =>
          prev.map((g, idx) => {
            if (idx !== groupIdx) return g;
            return {
              ...g,
              media: [
                ...g.media,
                {
                  type,
                  url: uploadData.key,
                  alt: file.name.split(".").slice(0, -1).join("."),
                  sortOrder: g.media.length,
                  mimeType: file.type,
                },
              ],
            };
          })
        );
        toast.success(`${file.name} uploaded successfully!`);
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingGroupIdx(null);
    }
  }

  function updateMediaItem(
    gi: number,
    mi: number,
    field: string,
    value: string
  ) {
    setVariantMedia((prev) =>
      prev.map((g, gidx) =>
        gidx === gi
          ? {
            ...g,
            media: g.media.map((m, midx) =>
              midx === mi ? { ...m, [field]: value } : m
            ),
          }
          : g
      )
    );
  }

  function removeMediaItem(gi: number, mi: number) {
    setVariantMedia((prev) =>
      prev.map((g, gidx) =>
        gidx === gi ? { ...g, media: g.media.filter((_, i) => i !== mi) } : g
      )
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 space-y-4">
        <Package className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="font-heading text-xl font-bold">Product not found</h2>
        <Button variant="default" asChild>
          <Link href="/admin/products">← Back to Products</Link>
        </Button>
      </div>
    );
  }

  const isPublished = !!product.publishedAt;
  const activeSkuCount = skus.filter((s) => s.isActive).length;
  const totalStock = skus.reduce((sum, s) => sum + (s.stockQuantity ?? 0), 0);

  return (
    <div className="max-w-4xl space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold truncate max-w-[400px]">
              {product.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              /{product.slug}
            </p>
          </div>
        </div>

        {/* Status + Publish button */}
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge tone={isPublished ? "success" : "warning"}>
            {isPublished ? "Published" : "Draft"}
          </StatusBadge>
          {isPublished ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnpublish}
              disabled={publishing}
              className="gap-1.5"
            >
              {publishing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
              Unpublish
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handlePublish}
              disabled={publishing || activeSkuCount === 0}
              className="gap-1.5"
              title={
                activeSkuCount === 0
                  ? "Add at least 1 active SKU before publishing"
                  : undefined
              }
            >
              {publishing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Globe className="h-3.5 w-3.5" />
              )}
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Publish readiness bar */}
      {!isPublished && (
        <PublishReadinessBar
          activeSkuCount={activeSkuCount}
          hasMedia={product.variantMedia?.some((g) => g.media?.length > 0) ?? false}
        />
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList className="w-full justify-start h-auto p-1 gap-1">
          {[
            { value: "details", label: "Details" },
            { value: "variants", label: "Variants & Media" },
            { value: "skus", label: `SKUs (${skus.length})` },
            { value: "settings", label: "SEO & Slug" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-sm px-4"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Tab: Details ─────────────────────────────────────────────── */}
        <TabsContent value="details" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label>Short Description</Label>
                <Input
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  maxLength={500}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  maxLength={5000}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">— Select —</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const t = tagInput.trim();
                        if (t && !tags.includes(t)) setTags([...tags, t]);
                        setTagInput("");
                      }
                    }}
                    placeholder="Type and press Enter"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const t = tagInput.trim();
                      if (t && !tags.includes(t)) setTags([...tags, t]);
                      setTagInput("");
                    }}
                  >
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <Badge key={t} variant="secondary" className="gap-1 pl-2 pr-1 py-0.5">
                        {t}
                        <button onClick={() => setTags(tags.filter((x) => x !== t))} className="ml-1 hover:text-destructive transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Style Code</Label>
                <Input value={styleCode} onChange={(e) => setStyleCode(e.target.value)} placeholder="e.g. BSAREE-001" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tax & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>GST %</Label>
                  <select
                    value={gstPercentage}
                    onChange={(e) => setGstPercentage(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {[0, 5, 12, 18, 28].map((v) => <option key={v} value={v}>{v}%</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>HSN Code</Label>
                  <Input value={hsn} onChange={(e) => setHsn(e.target.value)} placeholder="e.g. 50079090" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Material</Label>
                <Input value={material} onChange={(e) => setMaterial(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Care Instructions</Label>
                <textarea
                  value={careInstructions}
                  onChange={(e) => setCareInstructions(e.target.value)}
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <div className="flex gap-6">
                <ToggleField id="featured-edit" checked={isFeatured} onChange={setIsFeatured} label="Featured" desc="Show in featured section" />
                <ToggleField id="active-edit" checked={isActive} onChange={setIsActive} label="Active" desc="Visible in admin" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pb-6">
            <Button variant="default" onClick={handleSaveDetails} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Details
            </Button>
          </div>
        </TabsContent>

        {/* ── Tab: Variants & Media ─────────────────────────────────────── */}
        <TabsContent value="variants" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Variant Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {variantOptions.length === 0 && (
                <div className="text-center py-5 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  No variant options defined yet.
                </div>
              )}
              {variantOptions.map((opt, i) => (
                <VariantOptionRow
                  key={i}
                  option={opt}
                  onNameChange={(v) => updateOptionName(i, v)}
                  onAddValue={(v) => addOptionValue(i, v)}
                  onRemoveValue={(vi) => removeOptionValue(i, vi)}
                  onRemove={() => removeOption(i)}
                />
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addVariantOption} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            </CardContent>
          </Card>

          {variantOptions.some((o) => o.values.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Visual Attribute (Image Gallery Axis)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Which variant drives the image groups?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setVisualAttributeName("")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${!visualAttributeName ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}>
                    None
                  </button>
                  {variantOptions.filter((o) => o.name && o.values.length > 0).map((opt) => (
                    <button key={opt.name} type="button" onClick={() => setVisualAttributeName(opt.name)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${visualAttributeName === opt.name ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}>
                      {opt.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
           )}

          {/* Show Visual Selector Toggle */}
          {visualAttributeName && (
            <Card>
              <CardContent className="pt-6">
                <ToggleField
                  id="show-visual-selector-edit"
                  checked={showVisualSelector}
                  onChange={setShowVisualSelector}
                  label="Show visual attribute selector on storefront"
                  desc={
                    showVisualSelector
                      ? "Customers can switch between visual variants (e.g., colors) on the product page"
                      : "Visual attribute is used for admin media grouping only — hidden from customers (recommended for sister products)"
                  }
                />
                {!showVisualSelector && (
                  <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-md px-3 py-2">
                    ✦ The visual attribute ({visualAttributeName}) will still be used to organize media groups internally,
                    but won&apos;t appear as a selector on the storefront product page.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {variantMedia.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Media Groups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
                  Mark exactly one group as Cover — shown on listing pages.
                </p>
                {variantMedia.map((group, gi) => (
                  <div key={group.variantValue}
                    className={`rounded-lg border-2 p-4 space-y-4 ${group.isCoverGroup ? "border-primary/60 bg-primary/5" : "border-border"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm capitalize">{group.variantLabel}</span>
                        {group.isCoverGroup && <Badge variant="default" className="text-[10px]">Cover</Badge>}
                      </div>
                      {!group.isCoverGroup && (
                        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => setCoverGroup(gi)}>
                          Set as Cover
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {group.media.length > 0 && (
                        <div className="grid grid-cols-1 gap-2">
                          {group.media.map((m, mi) => (
                            <div key={mi} className="flex gap-3 items-center rounded-md border border-border p-2 bg-card relative group/media">
                              {m.url ? (
                                <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border flex items-center justify-center">
                                  {m.type === "video" ? (
                                    <video src={getMediaUrl(m.url)} className="h-full w-full object-cover" />
                                  ) : (
                                    <img src={getMediaUrl(m.url)} alt={m.alt} className="h-full w-full object-cover" />
                                  )}
                                </div>
                              ) : (
                                <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono truncate max-w-[200px]" title={m.url}>
                                    {m.url.split("/").pop()}
                                  </span>
                                  <Badge variant="secondary" className="text-[9px] uppercase px-1 py-0.5">
                                    {m.type}
                                  </Badge>
                                </div>
                                <Input
                                  className="h-7 text-xs w-full max-w-sm"
                                  value={m.alt}
                                  onChange={(e) => updateMediaItem(gi, mi, "alt", e.target.value)}
                                  placeholder="Alt text"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                                onClick={() => removeMediaItem(gi, mi)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          className="hidden"
                          id={`media-upload-${gi}`}
                          onChange={(e) => {
                            if (e.target.files) {
                              handleMediaUpload(gi, e.target.files);
                            }
                            e.target.value = "";
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          disabled={uploadingGroupIdx === gi}
                          onClick={() => document.getElementById(`media-upload-${gi}`)?.click()}
                        >
                          {uploadingGroupIdx === gi ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...</>
                          ) : (
                            <><Upload className="h-3.5 w-3.5" /> Upload Image / Video</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {variantMedia.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Button type="button" variant="outline" onClick={() => {
                  setVariantMedia([{
                    variantValue: "default",
                    variantLabel: "Default",
                    variantSlug: "default",
                    isCoverGroup: true,
                    media: []
                  }]);
                }}>
                  Add Default Media Group
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Use this if your product has no variants but needs images.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end pb-6">
            <Button variant="default" onClick={handleSaveVariants} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Variants & Media
            </Button>
          </div>
        </TabsContent>

        {/* ── Tab: SKUs ─────────────────────────────────────────────────── */}
        <TabsContent value="skus" className="space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total SKUs", value: skus.length },
              { label: "Active SKUs", value: activeSkuCount },
              { label: "Total Stock", value: totalStock },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border bg-card p-4 text-center">
                <p className="text-2xl font-bold font-heading">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Add SKU button */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Manage price, stock, and attributes for each variant.
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={() => { setEditingSku(null); setSkuSheetOpen(true); }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add SKU
            </Button>
          </div>

          {/* SKU Table */}
          <Card>
            <CardContent className="p-0">
              {skus.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <Package className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="font-medium">No SKUs yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add SKUs to set price and stock for each variant.
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-2"
                    onClick={() => { setEditingSku(null); setSkuSheetOpen(true); }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First SKU
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40">
                        {["SKU Code", "Attributes", "Price", "MRP", "Stock", "Status", ""].map((h) => (
                          <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${h === "" ? "text-right" : ""}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {skus.map((sku) => {
                        const isLowStock =
                          (sku.stockQuantity ?? 0) > 0 &&
                          (sku.stockQuantity ?? 0) <= (sku.lowStockThreshold ?? 5);
                        const isEditingStock = stockEditing[sku._id] !== undefined;

                        return (
                          <tr
                            key={sku._id}
                            className="border-b border-border/20 hover:bg-muted/20 transition-colors"
                          >
                            {/* SKU code */}
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs font-medium">{sku.sku}</span>
                            </td>

                            {/* Attributes */}
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {sku.attributes &&
                                  Object.entries(sku.attributes).map(([k, v]) => (
                                    <Badge key={k} variant="secondary" className="text-[10px] capitalize">
                                      {k}: {String(v)}
                                    </Badge>
                                  ))}
                              </div>
                            </td>

                            {/* Price */}
                            <td className="px-4 py-3 font-medium">
                              {formatPrice(sku.pricePaise)}
                            </td>

                            {/* MRP */}
                            <td className="px-4 py-3 text-muted-foreground line-through text-xs">
                              {formatPrice(sku.mrpPaise)}
                            </td>

                            {/* Stock — inline edit */}
                            <td className="px-4 py-3">
                              {isEditingStock ? (
                                <div className="flex gap-1 items-center">
                                  <Input
                                    type="number"
                                    value={stockEditing[sku._id]}
                                    onChange={(e) =>
                                      setStockEditing((prev) => ({
                                        ...prev,
                                        [sku._id]: e.target.value,
                                      }))
                                    }
                                    className="h-7 w-16 text-xs"
                                    min="0"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleStockSave(sku._id);
                                      if (e.key === "Escape")
                                        setStockEditing((prev) => {
                                          const next = { ...prev };
                                          delete next[sku._id];
                                          return next;
                                        });
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs px-2"
                                    onClick={() => handleStockSave(sku._id)}
                                  >
                                    ✓
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  className="flex items-center gap-1 group/stock"
                                  onClick={() =>
                                    setStockEditing((prev) => ({
                                      ...prev,
                                      [sku._id]: String(sku.stockQuantity ?? 0),
                                    }))
                                  }
                                  title="Click to edit stock"
                                >
                                  <span
                                    className={`font-medium ${(sku.stockQuantity ?? 0) === 0
                                      ? "text-destructive"
                                      : isLowStock
                                        ? "text-amber-600 dark:text-amber-400"
                                        : ""
                                      }`}
                                  >
                                    {sku.stockQuantity ?? 0}
                                  </span>
                                  {isLowStock && (
                                    <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                  )}
                                  <Pencil className="h-3 w-3 opacity-0 group-hover/stock:opacity-60 transition-opacity text-muted-foreground" />
                                </button>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              <StatusBadge
                                tone={sku.isActive ? "success" : "neutral"}
                                className="text-[10px]"
                              >
                                {sku.isActive ? "Active" : "Inactive"}
                              </StatusBadge>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  title="Edit SKU"
                                  onClick={() => {
                                    setEditingSku(sku);
                                    setSkuSheetOpen(true);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title="Delete SKU"
                                  onClick={() => {
                                    setDeletingSkuId(sku._id);
                                    setDeletingConfirm(true);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center">
            💡 Click the stock number to edit it inline. Press Enter to save, Esc to cancel.
          </p>
        </TabsContent>

        {/* ── Tab: SEO & Slug ───────────────────────────────────────────── */}
        <TabsContent value="settings" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">URL Slug</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Slug</Label>
                <div className="flex gap-2">
                  <Input
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    className="font-mono text-sm flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleSetSlug}
                    disabled={slugSaving || newSlug === product.slug}
                  >
                    {slugSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Auto-generate from product name"
                    onClick={handleAutoSlug}
                    disabled={slugSaving}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Old slugs are kept as redirects automatically.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Meta Title <span className="text-xs font-normal text-muted-foreground">(max 120 chars)</span></Label>
                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={120} placeholder="Leave blank to auto-generate from product name" />
              </div>
              <div className="space-y-2">
                <Label>Meta Description <span className="text-xs font-normal text-muted-foreground">(max 320 chars)</span></Label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  maxLength={320}
                  rows={3}
                  placeholder="Leave blank to auto-generate from description"
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <div className="flex justify-end">
                <Button variant="default" onClick={handleSaveSeo} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save SEO
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── SKU Form Sheet ───────────────────────────────────────────────── */}
      <SkuFormSheet
        productId={productId}
        variantOptions={product.variantOptions ?? []}
        sku={editingSku}
        open={skuSheetOpen}
        onOpenChange={setSkuSheetOpen}
        onSuccess={refreshSkus}
      />

      {/* ── Delete SKU Confirm Dialog ─────────────────────────────────────── */}
      <DeleteConfirmationDialog
        open={deletingConfirm}
        onOpenChange={setDeletingConfirm}
        onConfirm={handleDeleteSku}
        title="Delete SKU?"
        description="This will soft-delete the SKU and remove it from the storefront. Stock will be adjusted automatically. This cannot be undone from the UI."
      />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PublishReadinessBar({
  activeSkuCount,
  hasMedia,
}: {
  activeSkuCount: number;
  hasMedia: boolean;
}) {
  const checks = [
    { label: "At least 1 active SKU", done: activeSkuCount > 0 },
    { label: "At least 1 media item", done: hasMedia },
  ];
  const allDone = checks.every((c) => c.done);
  return (
    <div className={`rounded-lg border px-4 py-3 flex flex-wrap gap-x-6 gap-y-2 items-center text-sm ${allDone ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
      <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
        Publish requirements
      </p>
      {checks.map((c) => (
        <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.done ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
          {c.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
          {c.label}
        </div>
      ))}
    </div>
  );
}

function ToggleField({
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
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
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

function VariantOptionRow({
  option,
  onNameChange,
  onAddValue,
  onRemoveValue,
  onRemove,
}: {
  option: { name: string; values: Array<{ value: string; label: string }> };
  onNameChange: (v: string) => void;
  onAddValue: (v: string) => void;
  onRemoveValue: (i: number) => void;
  onRemove: () => void;
}) {
  const [valInput, setValInput] = useState("");
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex gap-2 items-center">
        <Input value={option.name} onChange={(e) => onNameChange(e.target.value)} placeholder="Option name (e.g. Color, Size)" className="flex-1 h-9" />
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          value={valInput}
          onChange={(e) => setValInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); onAddValue(valInput); setValInput(""); }
          }}
          placeholder="Type a value and press Enter"
          className="flex-1 h-8 text-sm"
        />
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => { onAddValue(valInput); setValInput(""); }}>
          Add
        </Button>
      </div>
      {option.values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {option.values.map((v, i) => (
            <Badge key={v.value} variant="secondary" className="gap-1 pl-2 pr-1 py-0.5">
              {v.label}
              <button type="button" onClick={() => onRemoveValue(i)} className="ml-1 hover:text-destructive transition-colors">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function slugify(str: string): string {
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
