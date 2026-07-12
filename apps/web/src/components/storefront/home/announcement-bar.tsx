"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import type { IAnnouncementBar, AnnouncementTone } from "@/types";

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
  const [messageIndex, setMessageIndex] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

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
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const messages = useMemo(
    () => bar?.messages.map((message) => message.trim()).filter(Boolean) ?? [],
    [bar],
  );

  useEffect(() => {
    if (!bar || !bar.enabled || messages.length === 0) {
      setDismissed(true);
      return;
    }
    const key = `vh_ann_${hashMessage(JSON.stringify(bar))}`;
    setDismissed(!!localStorage.getItem(key));
  }, [bar, messages.length]);

  useEffect(() => {
    if (!bar || bar.mode !== "typewriter" || messages.length === 0 || reduceMotion) {
      setMessageIndex(0);
      setCharacterCount(messages[0]?.length ?? 0);
      setDeleting(false);
      return;
    }

    const current = messages[messageIndex % messages.length];
    const finishedTyping = !deleting && characterCount >= current.length;
    const finishedDeleting = deleting && characterCount === 0;
    const delay = finishedTyping ? 1600 : finishedDeleting ? 250 : deleting ? 28 : 55;
    const timer = window.setTimeout(() => {
      if (finishedTyping) {
        setDeleting(true);
      } else if (finishedDeleting) {
        setDeleting(false);
        setMessageIndex((index) => (index + 1) % messages.length);
      } else {
        setCharacterCount((count) => count + (deleting ? -1 : 1));
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [bar, messages, messageIndex, characterCount, deleting, reduceMotion]);

  if (!bar || !bar.enabled || messages.length === 0 || dismissed) return null;

  const key = `vh_ann_${hashMessage(JSON.stringify(bar))}`;
  const tone = TONE_CLASSES[bar.tone] ?? TONE_CLASSES.default;
  const isTypewriter = bar.mode === "typewriter";
  const rawSlice = isTypewriter
    ? messages[messageIndex % messages.length].slice(0, characterCount)
    : messages[0];
  // Use a non-breaking space when the slice is empty so the element keeps its
  // line-height and the bar never collapses to zero height.
  const currentMessage = rawSlice || "\u00A0";

  return (
    <div className={`relative ${tone}`} style={{ minHeight: "2.25rem" }}>
      <div className="mx-auto max-w-7xl px-8 py-2 text-center text-sm">
        <span aria-label={messages[messageIndex % messages.length]}>
          {currentMessage}
          {isTypewriter && (
            <span
              className="inline-block w-[2px] align-middle ml-0.5"
              style={{
                height: "1em",
                backgroundColor: "currentColor",
                animation: "ann-cursor-blink 0.7s step-end infinite",
              }}
              aria-hidden="true"
            />
          )}
        </span>
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
