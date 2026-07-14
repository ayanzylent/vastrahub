"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Plus, X, GripVertical, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMediaUrl } from "@/lib/media";
import { api } from "@/lib/api";

/** Minimal product shape needed by the picker. */
export interface PickerProduct {
  _id: string;
  name: string;
  slug?: string;
  variantMedia?: Array<{ isCoverGroup?: boolean; media?: Array<{ type: string; url: string }> }>;
}

function coverImage(p: PickerProduct): string | null {
  const group = p.variantMedia?.find((vm) => vm.isCoverGroup) ?? p.variantMedia?.[0];
  const img = group?.media?.find((m) => m.type === "image");
  return img?.url ? getMediaUrl(img.url) : null;
}

interface CollectionProductPickerProps {
  /** Ordered selected product ids. */
  productIds: string[];
  /** Hydrated product docs for the selected ids (for display). */
  selectedProducts: PickerProduct[];
  onChange: (ids: string[], products: PickerProduct[]) => void;
}

export function CollectionProductPicker({
  productIds,
  selectedProducts,
  onChange,
}: CollectionProductPickerProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PickerProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Debounced product search against the admin list endpoint.
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      const res = await api.get<PickerProduct[]>(
        `/api/v1/admin/products?search=${encodeURIComponent(search.trim())}&limit=10`,
      );
      if (cancelled) return;
      // Admin product list returns a paginated top-level shape.
      const data = (res as unknown as { data?: PickerProduct[] }).data ?? [];
      setResults(Array.isArray(data) ? data : []);
      setSearching(false);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search]);

  const selectedSet = new Set(productIds);

  function addProduct(p: PickerProduct) {
    if (selectedSet.has(p._id)) return;
    onChange([...productIds, p._id], [...selectedProducts, p]);
  }

  function removeProduct(id: string) {
    onChange(
      productIds.filter((x) => x !== id),
      selectedProducts.filter((p) => p._id !== id),
    );
  }

  function reorder(from: number, to: number) {
    if (to < 0 || to >= productIds.length || from === to) return;
    const ids = [...productIds];
    const prods = [...selectedProducts];
    const [id] = ids.splice(from, 1);
    const [prod] = prods.splice(from, 1);
    ids.splice(to, 0, id);
    prods.splice(to, 0, prod);
    onChange(ids, prods);
  }

  function handleDrop(target: number) {
    if (dragIndex.current !== null) reorder(dragIndex.current, target);
    dragIndex.current = null;
    setDragOver(null);
  }

  // selectedProducts may be sparse (e.g. editing before hydration); fall back to id.
  const orderedSelected = productIds.map(
    (id) => selectedProducts.find((p) => p._id === id) ?? { _id: id, name: id },
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products to add…"
            className="pl-9"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Search results */}
        {results.length > 0 && (
          <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-border/50 divide-y divide-border/30">
            {results.map((p) => {
              const already = selectedSet.has(p._id);
              const img = coverImage(p);
              return (
                <div key={p._id} className="flex items-center gap-3 p-2 hover:bg-muted/30">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded bg-muted/50 border border-border/40">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={p.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <span className="flex-1 truncate text-sm">{p.name}</span>
                  <Button
                    type="button"
                    variant={already ? "ghost" : "outline"}
                    size="sm"
                    disabled={already}
                    onClick={() => addProduct(p)}
                  >
                    {already ? "Added" : (<><Plus className="mr-1 h-3.5 w-3.5" /> Add</>)}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected / ordered list */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">
            Selected products ({orderedSelected.length})
          </span>
          <span className="text-xs text-muted-foreground">Drag to reorder</span>
        </div>

        {orderedSelected.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 py-6 text-center text-sm text-muted-foreground">
            No products yet. Search above to add products to this collection.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {orderedSelected.map((p, index) => {
              const img = coverImage(p as PickerProduct);
              return (
                <li
                  key={p._id}
                  draggable
                  onDragStart={() => (dragIndex.current = index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(index);
                  }}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={() => {
                    dragIndex.current = null;
                    setDragOver(null);
                  }}
                  className={`flex items-center gap-2 rounded-md border bg-card p-2 transition-colors ${
                    dragOver === index ? "border-primary/60 bg-primary/5" : "border-border/50"
                  }`}
                >
                  <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                  <span className="w-6 shrink-0 text-center text-xs text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-muted/50 border border-border/40">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={p.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <span className="flex-1 truncate text-sm">{p.name}</span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === 0}
                      onClick={() => reorder(index, index - 1)}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === orderedSelected.length - 1}
                      onClick={() => reorder(index, index + 1)}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeProduct(p._id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
