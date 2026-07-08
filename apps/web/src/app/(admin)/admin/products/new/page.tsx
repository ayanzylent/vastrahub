"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  X,
  Image as ImageIcon,
  ChevronRight,
  Upload,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { getMediaUrl } from "@/lib/media";
import type { ICategory, IVariantOption } from "@/types";
import { BRAND_CONFIG } from "@/constants";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MediaItemDraft {
  type: "image" | "video";
  url: string;
  alt: string;
  sortOrder: number;
  mimeType: string;
}

interface VariantMediaDraft {
  variantValue: string;
  variantLabel: string;
  variantSlug: string;
  isCoverGroup: boolean;
  media: MediaItemDraft[];
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Variants & Media" },
  { id: 3, label: "Review & Save" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step.id < current
                ? "bg-primary text-primary-foreground"
                : step.id === current
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
                }`}
            >
              {step.id < current ? (
                <Check className="h-4 w-4" />
              ) : (
                step.id
              )}
            </div>
            <span
              className={`mt-1.5 text-xs font-medium whitespace-nowrap ${step.id === current
                ? "text-foreground"
                : "text-muted-foreground"
                }`}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-px w-16 mx-2 mb-5 transition-colors ${step.id < current
                ? "bg-primary"
                : "bg-border"
                }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Wizard ─────────────────────────────────────────────────────────────

export default function NewProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [saving, setSaving] = useState(false);

  // Step 1 — Basic Info
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
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // Step 2 — Variants & Media
  const [variantOptions, setVariantOptions] = useState<
    Array<{ name: string; type: string; values: Array<{ value: string; label: string; slug: string }> }>
  >([]);
  const [visualAttributeName, setVisualAttributeName] = useState("");
  const [showVisualSelector, setShowVisualSelector] = useState(true);
  const [variantMedia, setVariantMedia] = useState<VariantMediaDraft[]>([]);
  const [uploadingGroupIdx, setUploadingGroupIdx] = useState<number | null>(null);

  // Load categories
  useEffect(() => {
    api.get<ICategory[]>("/api/v1/storefront/categories").then((res) => {
      if (res.success && res.data) {
        setCategories(Array.isArray(res.data) ? res.data : []);
      }
    });
  }, []);

  // Sync variantMedia groups whenever visual attribute or its values change
  useEffect(() => {
    if (!visualAttributeName) {
      setVariantMedia([]);
      return;
    }
    const visualOption = variantOptions.find(
      (opt) => opt.name === visualAttributeName
    );
    if (!visualOption || visualOption.values.length === 0) {
      setVariantMedia([]);
      return;
    }

    setVariantMedia((prev) => {
      return visualOption.values.map((val, i) => {
        const existing = prev.find((m) => m.variantValue === val.value);
        return (
          existing ?? {
            variantValue: val.value,
            variantLabel: val.label || val.value,
            variantSlug: val.slug || slugify(val.value),
            isCoverGroup: i === 0,
            media: [],
          }
        );
      });
    });
  }, [visualAttributeName, variantOptions]);

  // Auto-default showVisualSelector OFF when visual attribute has only 1 value (Strategy A hint)
  useEffect(() => {
    if (!visualAttributeName) return;
    const visualOption = variantOptions.find(
      (opt) => opt.name === visualAttributeName
    );
    if (visualOption && visualOption.values.length === 1) {
      setShowVisualSelector(false);
    } else if (visualOption && visualOption.values.length > 1) {
      setShowVisualSelector(true);
    }
  }, [visualAttributeName, variantOptions]);

  // ── Tag helpers ───────────────────────────────────────────────────────────

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  }

  // ── Variant option helpers ────────────────────────────────────────────────

  function addVariantOption() {
    setVariantOptions([
      ...variantOptions,
      { name: "", type: "select", values: [] },
    ]);
  }

  function updateOptionName(i: number, name: string) {
    const next = [...variantOptions];
    next[i] = { ...next[i], name };
    setVariantOptions(next);
  }

  function addOptionValue(i: number, rawVal: string) {
    if (!rawVal.trim()) return;
    const next = [...variantOptions];
    const existing = next[i].values.find(
      (v) => v.value === rawVal.trim().toLowerCase()
    );
    if (!existing) {
      const slug = slugify(rawVal.trim());
      next[i].values.push({
        value: rawVal.trim().toLowerCase(),
        label: rawVal.trim(),
        slug,
      });
      setVariantOptions(next);
    }
  }

  function removeOptionValue(optIdx: number, valIdx: number) {
    const next = [...variantOptions];
    next[optIdx].values.splice(valIdx, 1);
    setVariantOptions(next);
  }

  function removeOption(i: number) {
    const opt = variantOptions[i];
    if (visualAttributeName === opt.name) setVisualAttributeName("");
    setVariantOptions(variantOptions.filter((_, idx) => idx !== i));
  }

  // ── Variant media helpers ─────────────────────────────────────────────────

  function setCoverGroup(groupIdx: number) {
    setVariantMedia((prev) =>
      prev.map((g, i) => ({ ...g, isCoverGroup: i === groupIdx }))
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
    groupIdx: number,
    mediaIdx: number,
    field: keyof MediaItemDraft,
    value: string
  ) {
    setVariantMedia((prev) =>
      prev.map((g, gi) =>
        gi === groupIdx
          ? {
            ...g,
            media: g.media.map((m, mi) =>
              mi === mediaIdx ? { ...m, [field]: value } : m
            ),
          }

          : g
      )
    );
  }

  function removeMediaItem(groupIdx: number, mediaIdx: number) {
    setVariantMedia((prev) =>
      prev.map((g, gi) =>
        gi === groupIdx
          ? { ...g, media: g.media.filter((_, mi) => mi !== mediaIdx) }
          : g
      )
    );
  }

  // ── Step validation ───────────────────────────────────────────────────────

  function validateStep1(): string | null {
    if (!name.trim()) return "Product name is required";
    if (!description.trim()) return "Description is required";
    if (!categoryId) return "Please select a category";
    return null;
  }

  function validateStep2(): string | null {
    if (variantOptions.length === 0) {
      return "At least one variant option is required";
    }
    const hasValues = variantOptions.some((opt) => opt.values.length > 0);
    if (!hasValues) {
      return "Please add at least one value to your variant options";
    }
    if (!visualAttributeName) {
      return "Please select a visual attribute (image gallery axis)";
    }
    if (variantMedia.length > 0) {
      const coverCount = variantMedia.filter((m) => m.isCoverGroup).length;
      if (coverCount !== 1) {
        return "Exactly one variant media group must be marked as Cover";
      }
    }
    return null;
  }

  function goNext() {
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        toast.error(err);
        return;
      }
    }
    if (step === 2) {
      const err = validateStep2();
      if (err) {
        toast.error(err);
        return;
      }
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSave(publish = false) {
    const err = validateStep1() ?? validateStep2();
    if (err) {
      toast.error(err);
      return;
    }

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
        variantOptions: variantOptions.map((opt) => ({
          name: opt.name,
          type: opt.type,
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
        material: material.trim() || undefined,
        careInstructions: careInstructions.trim() || undefined,
        hsn: hsn.trim() || undefined,
        gstPercentage: Number(gstPercentage),
        isActive: publish ? true : isActive,
        isFeatured,
        metadata: {
          metaTitle: metaTitle.trim() || undefined,
          metaDescription: metaDescription.trim() || undefined,
        },
      };

      const res = await api.post<{ _id: string }>("/api/v1/admin/products", body);
      if (res.success && res.data) {
        toast.success("Product created! Now add SKUs.");
        router.push(`/admin/products/${res.data._id}/edit?tab=skus`);
      } else {
        toast.error(res.error ?? "Failed to create product");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold">New Product</h1>
          <p className="text-sm text-muted-foreground">
            Fill in the details to add a product to your catalog
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex justify-center py-2">
        <StepIndicator current={step} />
      </div>

      {/* ── STEP 1: Basic Info ─────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Core fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Banarasi Silk Saree"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {name.length}/200 — Slug will be auto-generated from this
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="short-desc">Short Description</Label>
                <Input
                  id="short-desc"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="One-line tagline for listings"
                  maxLength={500}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">
                  Description <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Full product description, material details, style notes..."
                  rows={5}
                  maxLength={5000}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/5000
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Category + Brand */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">— Select category —</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder={"e.g. " + BRAND_CONFIG.NAME}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Type a tag and press Enter"
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="gap-1 pl-2 pr-1 py-0.5"
                      >
                        {t}
                        <button
                          onClick={() => setTags(tags.filter((x) => x !== t))}
                          className="ml-1 rounded-full hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              {visualAttributeName && (
                <ReviewRow
                  label="Visual Selector"
                  value={
                    showVisualSelector
                      ? `Shown on storefront (${visualAttributeName})`
                      : `Hidden on storefront (${visualAttributeName} used for media grouping only)`
                  }
                />
              )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="style-code">
                  Style Code{" "}
                  <span className="text-muted-foreground font-normal text-xs">
                    (links same style in different colors as sister products)
                  </span>
                </Label>
                <Input
                  id="style-code"
                  value={styleCode}
                  onChange={(e) => setStyleCode(e.target.value)}
                  placeholder="e.g. BSAREE-001"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tax & Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tax & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gst">GST Percentage</Label>
                  <select
                    id="gst"
                    value={gstPercentage}
                    onChange={(e) => setGstPercentage(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {[0, 5, 12, 18, 28].map((v) => (
                      <option key={v} value={v}>
                        {v}%
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hsn">HSN Code</Label>
                  <Input
                    id="hsn"
                    value={hsn}
                    onChange={(e) => setHsn(e.target.value)}
                    placeholder="e.g. 50079090"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="e.g. 100% Pure Silk"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="care">Care Instructions</Label>
                <textarea
                  id="care"
                  value={careInstructions}
                  onChange={(e) => setCareInstructions(e.target.value)}
                  placeholder="e.g. Dry clean only. Do not bleach."
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings + SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Settings & SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-6">
                <ToggleField
                  id="featured"
                  checked={isFeatured}
                  onChange={setIsFeatured}
                  label="Featured Product"
                  desc="Show in featured section"
                />
                <ToggleField
                  id="active"
                  checked={isActive}
                  onChange={setIsActive}
                  label="Active"
                  desc="Visible to storefront admins"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta-title">Meta Title</Label>
                <Input
                  id="meta-title"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Override auto-generated title (max 120 chars)"
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta-desc">Meta Description</Label>
                <Input
                  id="meta-desc"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Override auto-generated description (max 320 chars)"
                  maxLength={320}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── STEP 2: Variants & Media ───────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Variant Options Builder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Variant Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {variantOptions.length === 0 && (
                <div className="text-center py-6 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  No variant options yet. Add Color, Size, or any other axis.
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariantOption}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Variant Option
              </Button>
            </CardContent>
          </Card>

          {/* Visual Attribute Selector */}
          {variantOptions.some((o) => o.values.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Visual Attribute (Image Gallery Axis)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Which variant axis drives the product image groups? (e.g.
                  Color = one image set per color)
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setVisualAttributeName("")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${!visualAttributeName
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary"
                      }`}
                  >
                    None
                  </button>
                  {variantOptions
                    .filter((o) => o.name && o.values.length > 0)
                    .map((opt) => (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setVisualAttributeName(opt.name)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${visualAttributeName === opt.name
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary"
                          }`}
                      >
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
                  id="show-visual-selector"
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
                  <p className="mt-3 text-xs text-chart-2 bg-chart-2/10 rounded-md px-3 py-2">
                    ✦ The visual attribute ({visualAttributeName}) will still be used to organize media groups internally,
                    but won&apos;t appear as a selector on the storefront product page.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Variant Media Groups */}
          {variantMedia.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Media Groups
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    — one group per {visualAttributeName} value
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  ✦ Mark exactly one group as <strong>Cover</strong> — this is
                  the gallery shown on listing pages.
                </p>
                {variantMedia.map((group, gi) => (
                  <div
                    key={group.variantValue}
                    className={`rounded-lg border-2 p-4 space-y-4 transition-all ${group.isCoverGroup
                      ? "border-primary/60 bg-primary/5"
                      : "border-border"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm capitalize">
                          {group.variantLabel}
                        </span>
                        {group.isCoverGroup && (
                          <Badge variant="default" className="text-[10px]">
                            Cover
                          </Badge>
                        )}
                      </div>
                      {!group.isCoverGroup && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setCoverGroup(gi)}
                        >
                          Set as Cover
                        </Button>
                      )}
                    </div>

                    {/* Media items */}
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

          {variantOptions.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              <p>Skip this step if your product has no variants.</p>
              <p className="text-xs mt-1">
                Media can also be added from the product edit page later.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: Review & Save ──────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review Before Saving</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <ReviewRow label="Product Name" value={name} />
              <ReviewRow
                label="Category"
                value={
                  categories.find((c) => c._id === categoryId)?.name ??
                  "—"
                }
              />
              {brand && <ReviewRow label="Brand" value={brand} />}
              {tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <ReviewRow
                label="GST"
                value={`${gstPercentage}%${hsn ? ` · HSN ${hsn}` : ""}`}
              />
              {variantOptions.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Variant Options
                  </p>
                  {variantOptions.map((opt) => (
                    <div
                      key={opt.name}
                      className="text-sm flex gap-2 items-start mb-1"
                    >
                      <span className="font-medium min-w-[80px]">
                        {opt.name}:
                      </span>
                      <span className="text-muted-foreground">
                        {opt.values.map((v) => v.label).join(", ") || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <ReviewRow
                label="Media Groups"
                value={
                  variantMedia.length > 0
                    ? `${variantMedia.length} groups, ${variantMedia.reduce((s, g) => s + g.media.length, 0)} media items`
                    : "None — add media from the edit page"
                }
              />
              <ReviewRow
                label="Status"
                value={isActive ? "Active" : "Draft (inactive)"}
              />
              {isFeatured && (
                <ReviewRow label="Featured" value="Yes" />
              )}
            </CardContent>
          </Card>

          <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 text-sm text-primary">
            <strong>After saving:</strong> You&apos;ll be taken directly to the SKU
            management page to add pricing and stock for each variant.
          </div>
        </div>
      )}

      {/* ── Navigation ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-8">
        <div>
          {step > 1 && (
            <Button variant="outline" onClick={goBack} disabled={saving}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          {step < 3 && (
            <Button variant="default" onClick={goNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {step === 3 && (
            <>
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save as Draft
              </Button>
              <Button
                variant="default"
                onClick={() => handleSave(true)}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save & Add SKUs
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

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
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors" />
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-primary-foreground rounded-full shadow transition-transform peer-checked:translate-x-4" />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </label>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <p className="text-xs text-muted-foreground min-w-[120px]">
        {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
    </div>
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
        <Input
          value={option.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Option name (e.g. Color, Size)"
          className="flex-1 h-9"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-destructive hover:text-destructive/80 hover:bg-destructive/10 shrink-0"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          value={valInput}
          onChange={(e) => setValInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddValue(valInput);
              setValInput("");
            }
          }}
          placeholder="Type a value and press Enter"
          className="flex-1 h-8 text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            onAddValue(valInput);
            setValInput("");
          }}
        >
          Add
        </Button>
      </div>
      {option.values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {option.values.map((v, i) => (
            <Badge
              key={v.value}
              variant="secondary"
              className="gap-1 pl-2 pr-1 py-0.5"
            >
              {v.label}
              <button
                type="button"
                onClick={() => onRemoveValue(i)}
                className="ml-1 rounded-full hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
