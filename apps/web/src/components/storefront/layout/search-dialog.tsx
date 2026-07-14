"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, Sparkles, X, CornerDownLeft, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BRAND_CONFIG } from "@/constants";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const POPULAR_SEARCHES = [
  "Silk Sarees",
  "Designer Lehengas",
  "Heritage Collections",
  "Cotton Kurtas",
  "New Arrivals",
];

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(BRAND_CONFIG.RECENT_SEARCH_KEY);
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load recent searches", e);
      }
    }
  }, [open]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
    }
  }, [open]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleSearchSubmit = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    // Save to recent searches
    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 5);
    setRecentSearches(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(BRAND_CONFIG.RECENT_SEARCH_KEY, JSON.stringify(updated));
    }

    onOpenChange(false);
    router.push(`/shop?search=${encodeURIComponent(trimmed)}`);
  };

  const handleClearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(BRAND_CONFIG.RECENT_SEARCH_KEY);
    }
  };

  const handleRemoveRecentItem = (itemToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== itemToRemove);
    setRecentSearches(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(BRAND_CONFIG.RECENT_SEARCH_KEY, JSON.stringify(updated));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="p-0 overflow-hidden max-sm:fixed max-sm:top-0! max-sm:left-0! max-sm:translate-x-0! max-sm:translate-y-0! max-sm:w-full! max-sm:h-full! max-sm:max-w-none! max-sm:max-h-none! max-sm:rounded-none! max-sm:border-0! flex flex-col gap-0 sm:max-w-lg bg-background border border-border shadow-2xl"
      >
        <DialogTitle className="sr-only">Search Products</DialogTitle>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearchSubmit(query);
          }}
          className="flex items-center border-b border-border px-4 py-3 shrink-0"
        >
          {/* Back button on mobile */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="sm:hidden mr-2.5 p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground shrink-0 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <Search className="h-5 w-5 text-muted-foreground mr-3 shrink-0 hidden sm:block" />

          <Input
            ref={inputRef}
            placeholder="Search sarees, lehengas, kurtas..."
            className="flex-1 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base p-0 h-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="mr-1 hover:bg-muted"
              onClick={() => setQuery("")}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
          <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 mr-1 text-muted-foreground animate-in fade-in-50 duration-200">
            esc
          </kbd>
          <Button type="submit" size="sm" variant="default" className="hidden sm:flex text-xs gap-1 shrink-0">
            Search
            <CornerDownLeft className="h-3 w-3" />
          </Button>
        </form>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 sm:max-h-[350px]">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 px-1">
                <span>Recent Searches</span>
                <button
                  type="button"
                  onClick={handleClearRecent}
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((item) => (
                  <div
                    key={item}
                    onClick={() => handleSearchSubmit(item)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/80 cursor-pointer group text-sm text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveRecentItem(item, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-destructive p-0.5 rounded transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Categories */}
          <div>
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 px-1 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary/80" />
              <span>Popular Searches</span>
            </div>
            <div className="flex flex-wrap gap-2 px-1">
              {POPULAR_SEARCHES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleSearchSubmit(item)}
                  className="px-3 py-1.5 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground text-xs font-medium text-foreground transition-all cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Keyboard Helper Footer */}
        <div className="border-t border-border px-4 py-2.5 bg-muted/30 hidden sm:flex items-center justify-between text-[11px] text-muted-foreground shrink-0">
          <div className="flex items-center gap-1">
            <span>Tip: Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[9px]">Ctrl</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[9px]">K</kbd>
            <span>to toggle search anywhere</span>
          </div>
          <div>
            <span>Press</span>
            <kbd className="ml-1 px-1.5 py-0.5 rounded bg-muted border font-mono text-[9px]">Enter</kbd>
            <span>to search</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
