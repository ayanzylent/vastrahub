"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface FilterSidebarProps {
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
  onApply: (minPrice: string, maxPrice: string, inStockOnly: boolean) => void;
  onClear: () => void;
  isMobile?: boolean;
}

export function FilterSidebar({
  minPrice,
  maxPrice,
  inStockOnly,
  onApply,
  onClear,
  isMobile = false,
}: FilterSidebarProps) {
  const [tempMinPrice, setTempMinPrice] = useState(minPrice);
  const [tempMaxPrice, setTempMaxPrice] = useState(maxPrice);
  const [tempInStockOnly, setTempInStockOnly] = useState(inStockOnly);

  // Sync temp state with parent state when it is changed externally (like badge clears or clear all button)
  useEffect(() => {
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setTempInStockOnly(inStockOnly);
  }, [minPrice, maxPrice, inStockOnly]);

  const handleApply = () => {
    onApply(tempMinPrice, tempMaxPrice, tempInStockOnly);
  };

  const handleClear = () => {
    setTempMinPrice("");
    setTempMaxPrice("");
    setTempInStockOnly(false);
    onClear();
  };

  if (isMobile) {
    return (
      <div className="flex flex-col h-full justify-between">
        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
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
        </div>

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

      <Button variant="default" className="w-full mt-4 font-medium" onClick={handleApply}>
        Apply Filters
      </Button>
    </div>
  );
}
