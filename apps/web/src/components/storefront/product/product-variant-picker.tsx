"use client";

import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ISku, IVariantOption } from "@/types";

interface ProductVariantPickerProps {
  productSlug: string;
  showVisualSelector?: boolean;
  colorOption?: IVariantOption;
  sizeOption?: IVariantOption;
  currentVariantGroup?: {
    variantSlug?: string;
    variantLabel?: string;
    variantValue?: string;
  } | null;
  selectedSize: string;
  onSelectedSizeChange: (size: string) => void;
  quantity: number;
  onQuantityChange: (quantity: number | ((prev: number) => number)) => void;
  findSku: (color: string | undefined, size: string) => ISku | null;
}

export function ProductVariantPicker({
  productSlug,
  showVisualSelector,
  colorOption,
  sizeOption,
  currentVariantGroup,
  selectedSize,
  onSelectedSizeChange,
  quantity,
  onQuantityChange,
  findSku,
}: ProductVariantPickerProps) {
  const router = useRouter();

  return (
    <>
      {/* ── Color Selector ── */}
      {showVisualSelector !== false &&
        colorOption &&
        colorOption.values.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2.5">
              {colorOption.name}:{" "}
              <span className="text-primary font-semibold">
                {currentVariantGroup?.variantLabel || "Select"}
              </span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {colorOption.values.map((color) => {
                const isActive =
                  currentVariantGroup?.variantSlug === color.slug;
                return (
                  <button
                    key={color.slug}
                    onClick={() =>
                      router.push(`/products/${productSlug}/${color.slug}`)
                    }
                    className={cn(
                      "relative rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50",
                    )}
                    title={color.label}
                  >
                    {color.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      {/* ── Size Selector ── */}
      {sizeOption && sizeOption.values.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm font-medium">
              Size:{" "}
              <span className="text-primary font-semibold">
                {selectedSize || "Select"}
              </span>
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {sizeOption.values.map((size) => {
              const sku = findSku(currentVariantGroup?.variantValue, size.value);
              const outOfStock = sku && sku.stockQuantity === 0;
              const isSelected = selectedSize === size.value;

              return (
                <button
                  key={size.value}
                  onClick={() => !outOfStock && onSelectedSizeChange(size.value)}
                  disabled={!!outOfStock}
                  className={cn(
                    "h-10 min-w-[44px] rounded-lg border px-3 text-sm font-medium transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 hover:bg-primary/5",
                    outOfStock && "opacity-40 cursor-not-allowed line-through",
                  )}
                >
                  {size.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quantity (compact) ── */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Qty:</span>
        <div className="flex items-center border rounded-lg overflow-hidden">
          <button
            className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
            disabled={quantity <= 1}
            onClick={() => onQuantityChange((q) => Math.max(1, q - 1))}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="text-sm font-medium w-8 text-center border-x">
            {quantity}
          </span>
          <button
            className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
            disabled={quantity >= 10}
            onClick={() => onQuantityChange((q) => Math.min(10, q + 1))}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
