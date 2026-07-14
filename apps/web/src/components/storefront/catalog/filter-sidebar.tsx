"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { COLOR_FILTER_OPTIONS } from "@/lib/color-filters";

interface FilterSidebarProps {
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
  selectedColors: string[];
  onApply: (minPrice: string, maxPrice: string, inStockOnly: boolean, colors: string[]) => void;
  onClear: () => void;
  isMobile?: boolean;
}

function ColorSwatch({ hex, label }: { hex: string; label: string }) {
  if (hex === "multicolor") {
    return (
      <span
        className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-border"
        style={{
          background:
            "conic-gradient(#DC2626, #EAB308, #16A34A, #2563EB, #9333EA, #DC2626)",
        }}
        title={label}
        aria-hidden
      />
    );
  }

  return (
    <span
      className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-border"
      style={{ backgroundColor: hex }}
      title={label}
      aria-hidden
    />
  );
}

function ColorChecklist({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (label: string) => void;
}) {
  return (
    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
      {COLOR_FILTER_OPTIONS.map((color) => {
        const checked = selected.includes(color.label);
        return (
          <label
            key={color.label}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(color.label)}
              className="rounded border-border bg-transparent text-primary focus:ring-primary/20 h-4 w-4"
            />
            <ColorSwatch hex={color.hex} label={color.label} />
            <span className="text-sm font-medium">{color.label}</span>
          </label>
        );
      })}
    </div>
  );
}

export function FilterSidebar({
  minPrice,
  maxPrice,
  inStockOnly,
  selectedColors,
  onApply,
  onClear,
  isMobile = false,
}: FilterSidebarProps) {
  const [tempMinPrice, setTempMinPrice] = useState(minPrice);
  const [tempMaxPrice, setTempMaxPrice] = useState(maxPrice);
  const [tempInStockOnly, setTempInStockOnly] = useState(inStockOnly);
  const [tempColors, setTempColors] = useState<string[]>(selectedColors);

  // Sync temp state with parent state when it is changed externally (like badge clears or clear all button)
  useEffect(() => {
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setTempInStockOnly(inStockOnly);
    setTempColors(selectedColors);
  }, [minPrice, maxPrice, inStockOnly, selectedColors]);

  const handleToggleColor = (label: string) => {
    setTempColors((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label],
    );
  };

  const handleApply = () => {
    onApply(tempMinPrice, tempMaxPrice, tempInStockOnly, tempColors);
  };

  const handleClear = () => {
    setTempMinPrice("");
    setTempMaxPrice("");
    setTempInStockOnly(false);
    setTempColors([]);
    onClear();
  };

  const filterFields = (
    <>
      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Price Range (₹)</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={tempMinPrice}
            onChange={(e) => setTempMinPrice(e.target.value)}
            className="text-sm bg-background border-border"
          />
          <span className="flex items-center text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder="Max"
            value={tempMaxPrice}
            onChange={(e) => setTempMaxPrice(e.target.value)}
            className="text-sm bg-background border-border"
          />
        </div>
      </div>

      <Separator />

      {/* Color */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Color</Label>
        <ColorChecklist selected={tempColors} onToggle={handleToggleColor} />
      </div>

      <Separator />

      {/* In Stock */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={tempInStockOnly}
          onChange={(e) => setTempInStockOnly(e.target.checked)}
          className="rounded border-border bg-transparent text-primary focus:ring-primary/20 h-4 w-4"
        />
        <span className="text-sm font-medium">In Stock Only</span>
      </label>
    </>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col h-full justify-between">
        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">{filterFields}</div>

        {/* Sticky Footer for mobile */}
        <div className="border-t p-6 bg-background flex gap-4 shrink-0">
          <Button variant="outline" className="flex-1 font-medium" onClick={handleClear}>
            Clear All
          </Button>
          <Button variant="default" className="flex-1 font-medium" onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </div>
    );
  }

  // Desktop sidebar layout
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </h2>
        <button
          className="text-xs text-primary hover:underline font-medium"
          onClick={handleClear}
        >
          Clear All
        </button>
      </div>

      <Separator />

      {filterFields}

      <Button variant="default" className="w-full mt-4 font-medium" onClick={handleApply}>
        Apply Filters
      </Button>
    </div>
  );
}
