"use client";

import { useState, useEffect } from "react";
import { Loader2, Package, Wand2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { ISku } from "@vastrahub/shared-types";

interface VariantOptionLocal {
  name: string;
  type?: string;
  values: Array<{ value: string; label: string; slug?: string }>;
}

interface SkuFormSheetProps {
  productId: string;
  variantOptions: VariantOptionLocal[];
  sku?: ISku | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SkuFormSheet({
  productId,
  variantOptions,
  sku,
  open,
  onOpenChange,
  onSuccess,
}: SkuFormSheetProps) {
  const isEditing = !!sku;
  const [saving, setSaving] = useState(false);

  // Form fields
  const [skuCode, setSkuCode] = useState("");
  const [barcode, setBarcode] = useState("");
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [priceRupees, setPriceRupees] = useState("");
  const [mrpRupees, setMrpRupees] = useState("");
  const [costPriceRupees, setCostPriceRupees] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [weight, setWeight] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Populate form when sheet opens
  useEffect(() => {
    if (!open) return;

    if (sku) {
      setSkuCode(sku.sku ?? "");
      setBarcode(sku.barcode ?? "");
      const attrs: Record<string, string> = {};
      if (sku.attributes) {
        Object.entries(sku.attributes).forEach(([k, v]) => {
          attrs[k] = String(v);
        });
      }
      setAttributes(attrs);
      setPriceRupees(sku.pricePaise ? String(sku.pricePaise / 100) : "");
      setMrpRupees(sku.mrpPaise ? String(sku.mrpPaise / 100) : "");
      setCostPriceRupees(
        sku.costPricePaise ? String(sku.costPricePaise / 100) : ""
      );
      setStockQuantity(String(sku.stockQuantity ?? 0));
      setLowStockThreshold(String(sku.lowStockThreshold ?? 5));
      setWeight(sku.weight ? String(sku.weight) : "");
      setLengthCm(sku.dimensions?.length ? String(sku.dimensions.length) : "");
      setWidthCm(sku.dimensions?.width ? String(sku.dimensions.width) : "");
      setHeightCm(
        sku.dimensions?.height ? String(sku.dimensions.height) : ""
      );
      setIsDefault(sku.isDefault ?? false);
      setIsActive(sku.isActive ?? true);
    } else {
      // New SKU defaults
      setSkuCode("");
      setBarcode("");
      const initialAttrs: Record<string, string> = {};
      variantOptions.forEach((opt) => {
        initialAttrs[opt.name] = "";
      });
      setAttributes(initialAttrs);
      setPriceRupees("");
      setMrpRupees("");
      setCostPriceRupees("");
      setStockQuantity("0");
      setLowStockThreshold("5");
      setWeight("");
      setLengthCm("");
      setWidthCm("");
      setHeightCm("");
      setIsDefault(false);
      setIsActive(true);
    }
  }, [sku, open, variantOptions]);

  async function handleAutoGenerateSkuCode() {
    if (variantOptions.length > 0) {
      // Validate all attributes are selected
      for (const opt of variantOptions) {
        if (!attributes[opt.name]) {
          toast.error(`Please select a value for ${opt.name} first`);
          return;
        }
      }
    }
    
    setSaving(true);
    try {
      const res = await api.post<{ sku: string }>(`/api/v1/admin/products/${productId}/skus/generate-code`, {
        attributes,
      });
      if (res.success && res.data?.sku) {
        setSkuCode(res.data.sku);
        toast.success("SKU code generated");
      } else {
        toast.error(res.error ?? "Failed to generate SKU code");
      }
    } catch {
      toast.error("Failed to generate SKU code");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!skuCode.trim()) {
      toast.error("SKU code is required");
      return;
    }
    const price = parseFloat(priceRupees);
    const mrp = parseFloat(mrpRupees);
    if (!priceRupees || isNaN(price) || price <= 0) {
      toast.error("Selling price must be greater than ₹0");
      return;
    }
    if (!mrpRupees || isNaN(mrp) || mrp <= 0) {
      toast.error("MRP must be greater than ₹0");
      return;
    }
    if (price > mrp) {
      toast.error("Selling price cannot exceed MRP");
      return;
    }

    const body = {
      sku: skuCode.trim().toUpperCase(),
      barcode: barcode.trim() || undefined,
      attributes,
      pricePaise: Math.round(price * 100),
      mrpPaise: Math.round(mrp * 100),
      costPricePaise: costPriceRupees
        ? Math.round(parseFloat(costPriceRupees) * 100)
        : undefined,
      stockQuantity: Math.max(0, parseInt(stockQuantity) || 0),
      lowStockThreshold: Math.max(0, parseInt(lowStockThreshold) || 5),
      weight: weight ? parseFloat(weight) : undefined,
      dimensions:
        lengthCm || widthCm || heightCm
          ? {
              lengthCm: lengthCm ? parseFloat(lengthCm) : undefined,
              widthCm: widthCm ? parseFloat(widthCm) : undefined,
              heightCm: heightCm ? parseFloat(heightCm) : undefined,
            }
          : undefined,
      isDefault,
      isActive,
    };

    setSaving(true);
    try {
      const res = isEditing && sku
        ? await api.put<ISku>(`/api/v1/admin/skus/${sku._id}`, body)
        : await api.post<ISku>(`/api/v1/admin/products/${productId}/skus`, body);

      if (res.success) {
        toast.success(isEditing ? "SKU updated" : "SKU created successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.error ?? "Failed to save SKU");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const discount =
    priceRupees && mrpRupees && parseFloat(mrpRupees) > 0
      ? Math.round(
          ((parseFloat(mrpRupees) - parseFloat(priceRupees)) /
            parseFloat(mrpRupees)) *
            100
        )
      : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col p-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-brand-500" />
            </div>
            <div>
              <SheetTitle className="text-base">
                {isEditing ? "Edit SKU" : "Add New SKU"}
              </SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                {isEditing
                  ? `Editing ${sku?.sku}`
                  : "Fill in details to create a new SKU"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* SKU Code + Barcode */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Identification
            </h3>
            <div className="space-y-2">
              <Label htmlFor="sku-code">
                SKU Code <span className="text-red-400">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="sku-code"
                  value={skuCode}
                  onChange={(e) => setSkuCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SAREE-RED-FREE"
                  className="font-mono tracking-wide flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAutoGenerateSkuCode}
                  disabled={saving}
                  className="px-3"
                >
                  <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                  Auto
                </Button>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Globally unique. Auto-uppercased.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">
                Barcode{" "}
                <span className="text-[hsl(var(--muted-foreground))] font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="EAN / UPC barcode"
              />
            </div>
          </div>

          {/* Variant Attributes */}
          {variantOptions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Variant Attributes
              </h3>
              {variantOptions.map((opt) => (
                <div key={opt.name} className="space-y-2">
                  <Label className="capitalize">{opt.name}</Label>
                  {opt.values.length > 0 ? (
                    <select
                      value={attributes[opt.name] ?? ""}
                      onChange={(e) =>
                        setAttributes({
                          ...attributes,
                          [opt.name]: e.target.value,
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                    >
                      <option value="">— Select {opt.name} —</option>
                      {opt.values.map((v) => (
                        <option key={v.value} value={v.value}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      value={attributes[opt.name] ?? ""}
                      onChange={(e) =>
                        setAttributes({
                          ...attributes,
                          [opt.name]: e.target.value,
                        })
                      }
                      placeholder={`Enter ${opt.name}`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Pricing
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Selling Price <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[hsl(var(--muted-foreground))]">
                    ₹
                  </span>
                  <Input
                    id="price"
                    type="number"
                    value={priceRupees}
                    onChange={(e) => setPriceRupees(e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mrp">
                  MRP <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[hsl(var(--muted-foreground))]">
                    ₹
                  </span>
                  <Input
                    id="mrp"
                    type="number"
                    value={mrpRupees}
                    onChange={(e) => setMrpRupees(e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
            {discount > 0 && (
              <p className="text-xs text-green-500 font-medium">
                ✓ {discount}% discount off MRP
              </p>
            )}
            {parseFloat(priceRupees) > parseFloat(mrpRupees) &&
              mrpRupees && (
                <p className="text-xs text-red-400">
                  ✗ Price cannot exceed MRP
                </p>
              )}
            <div className="space-y-2">
              <Label htmlFor="cost">
                Cost Price{" "}
                <span className="text-[hsl(var(--muted-foreground))] font-normal text-xs">
                  (internal, optional)
                </span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[hsl(var(--muted-foreground))]">
                  ₹
                </span>
                <Input
                  id="cost"
                  type="number"
                  value={costPriceRupees}
                  onChange={(e) => setCostPriceRupees(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Inventory
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="stock">
                  Stock Quantity <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="stock"
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="low-stock">Low Stock Alert</Label>
                <Input
                  id="low-stock"
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Shipping{" "}
              <span className="normal-case font-normal">(optional)</span>
            </h3>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (grams)</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 250"
                min="0"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: "length",
                  label: "Length cm",
                  val: lengthCm,
                  set: setLengthCm,
                },
                {
                  id: "width",
                  label: "Width cm",
                  val: widthCm,
                  set: setWidthCm,
                },
                {
                  id: "height",
                  label: "Height cm",
                  val: heightCm,
                  set: setHeightCm,
                },
              ].map((dim) => (
                <div key={dim.id} className="space-y-2">
                  <Label htmlFor={dim.id} className="text-xs">
                    {dim.label}
                  </Label>
                  <Input
                    id={dim.id}
                    type="number"
                    value={dim.val}
                    onChange={(e) => dim.set(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Options
            </h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="is-default"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[hsl(var(--muted))] rounded-full peer peer-checked:bg-brand-500 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Default SKU</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Shown first when customers view the product
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="is-active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[hsl(var(--muted))] rounded-full peer peer-checked:bg-brand-500 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Inactive SKUs are hidden from the storefront
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="px-6 py-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="brand"
            className="flex-1"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Create SKU"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
