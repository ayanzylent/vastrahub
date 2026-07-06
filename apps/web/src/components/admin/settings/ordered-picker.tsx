"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Plus, X, GripVertical, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMediaUrl } from "@/lib/media";

/** Minimal shape the picker renders. `image` is a media key or URL (or null). */
export interface PickerItem {
  _id: string;
  name: string;
  image?: string | null;
}

interface OrderedPickerProps {
  /** Ordered selected ids (the source of truth). */
  ids: string[];
  onChange: (ids: string[]) => void;
  /** Search for items to add (debounced). */
  search: (query: string) => Promise<PickerItem[]>;
  /** Resolve selected ids into display items (for hydration on load). */
  resolve: (ids: string[]) => Promise<PickerItem[]>;
  searchPlaceholder?: string;
  emptyHint?: string;
  noun?: string;
}

/**
 * Generic ordered multi-select: search to add, drag / up-down to reorder,
 * remove. Backs the category, collection and product pickers. Zero deps —
 * mirrors the native-drag pattern used by collection-product-picker.
 */
export function OrderedPicker({
  ids,
  onChange,
  search,
  resolve,
  searchPlaceholder = "Search to add…",
  emptyHint = "Nothing selected yet. Search above to add.",
  noun = "items",
}: OrderedPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickerItem[]>([]);
  const [searching, setSearching] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Cache of id -> item for display (from search results + resolve).
  const [cache, setCache] = useState<Record<string, PickerItem>>({});
  const requested = useRef<Set<string>>(new Set());

  // Resolve any selected ids we don't yet have display data for.
  useEffect(() => {
    const missing = ids.filter((id) => !cache[id] && !requested.current.has(id));
    if (missing.length === 0) return;
    missing.forEach((id) => requested.current.add(id));
    let cancelled = false;
    (async () => {
      const items = await resolve(missing);
      if (cancelled || items.length === 0) return;
      setCache((prev) => {
        const next = { ...prev };
        for (const it of items) next[it._id] = it;
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [ids, cache, resolve]);

  // Debounced search.
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      const items = await search(query.trim());
      if (cancelled) return;
      setResults(items);
      setCache((prev) => {
        const next = { ...prev };
        for (const it of items) next[it._id] = it;
        return next;
      });
      setSearching(false);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, search]);

  const selectedSet = new Set(ids);

  function add(id: string) {
    if (selectedSet.has(id)) return;
    onChange([...ids, id]);
  }

  function remove(id: string) {
    onChange(ids.filter((x) => x !== id));
  }

  function reorder(from: number, to: number) {
    if (to < 0 || to >= ids.length || from === to) return;
    const next = [...ids];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function handleDrop(target: number) {
    if (dragIndex.current !== null) reorder(dragIndex.current, target);
    dragIndex.current = null;
    setDragOver(null);
  }

  const itemFor = (id: string): PickerItem => cache[id] ?? { _id: id, name: id };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {results.length > 0 && (
          <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-border/50 divide-y divide-border/30">
            {results.map((it) => {
              const already = selectedSet.has(it._id);
              const img = it.image ? getMediaUrl(it.image) : null;
              return (
                <div key={it._id} className="flex items-center gap-3 p-2 hover:bg-muted/30">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded bg-muted/50 border border-border/40">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={it.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <span className="flex-1 truncate text-sm">{it.name}</span>
                  <Button
                    type="button"
                    variant={already ? "ghost" : "outline"}
                    size="sm"
                    disabled={already}
                    onClick={() => add(it._id)}
                  >
                    {already ? "Added" : (<><Plus className="mr-1 h-3.5 w-3.5" /> Add</>)}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected / ordered */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">
            Selected {noun} ({ids.length})
          </span>
          <span className="text-xs text-muted-foreground">Drag to reorder</span>
        </div>

        {ids.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 py-6 text-center text-sm text-muted-foreground">
            {emptyHint}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {ids.map((id, index) => {
              const it = itemFor(id);
              const img = it.image ? getMediaUrl(it.image) : null;
              return (
                <li
                  key={id}
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
                      <img src={img} alt={it.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <span className="flex-1 truncate text-sm">{it.name}</span>
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
                      disabled={index === ids.length - 1}
                      onClick={() => reorder(index, index + 1)}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => remove(id)}
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
