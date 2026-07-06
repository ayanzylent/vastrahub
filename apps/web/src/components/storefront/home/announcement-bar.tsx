"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import type { IAnnouncementBar, AnnouncementTone } from "@vastrahub/shared-types";

const TONE_CLASSES: Record<AnnouncementTone, string> = {
  default: "bg-foreground text-background",
  promo: "bg-primary text-primary-foreground",
  info: "bg-blue-600 text-white",
  warning: "bg-amber-500 text-black",
};

/** Stable, cheap hash so a NEW message re-shows even after a prior dismiss. */
function hashMessage(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h >>> 0);
}

/**
 * Global, dismissible announcement bar. Rendered on every storefront page above
 * the header; self-fetches the lightweight announcement endpoint and remembers
 * dismissal per-message in localStorage.
 */
export function AnnouncementBar() {
  const [bar, setBar] = useState<IAnnouncementBar | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get<IAnnouncementBar>("/api/v1/storefront/announcement").then((res) => {
      if (!cancelled && res.success && res.data) setBar(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!bar || !bar.enabled || !bar.message) {
      setDismissed(true);
      return;
    }
    const key = `vh_ann_${hashMessage(bar.message)}`;
    setDismissed(!!localStorage.getItem(key));
  }, [bar]);

  if (!bar || !bar.enabled || !bar.message || dismissed) return null;

  const key = `vh_ann_${hashMessage(bar.message)}`;
  const tone = TONE_CLASSES[bar.tone] ?? TONE_CLASSES.default;

  return (
    <div className={`relative ${tone}`}>
      <div className="mx-auto max-w-7xl px-8 py-2 text-center text-sm">
        <span>{bar.message}</span>
        {bar.linkHref && bar.linkText && (
          <Link
            href={bar.linkHref}
            className="ml-2 font-medium underline underline-offset-2"
          >
            {bar.linkText}
          </Link>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          localStorage.setItem(key, "1");
          setDismissed(true);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 opacity-80 transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
