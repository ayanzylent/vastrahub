"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VideoProvider } from "@/types";

export interface VideoEmbedItem {
  provider: VideoProvider;
  caption?: string;
  embedSrc: string;
}

export function VideoEmbedScroll({ items }: { items: VideoEmbedItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-video-card]");
    const gap = 16;
    const step = (card?.offsetWidth ?? 320) + gap;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-4 md:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-roledescription="carousel"
      >
        {items.map((item, i) => {
          const aspect = item.provider === "youtube" ? "aspect-video" : "aspect-[4/5]";
          return (
            <div
              key={i}
              data-video-card
              className="w-full shrink-0 snap-start sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]"
            >
              <div className="space-y-2">
                <div
                  className={`relative overflow-hidden rounded-xl border border-border/50 bg-muted ${aspect}`}
                >
                  <iframe
                    src={item.embedSrc}
                    title={item.caption || "Embedded video"}
                    className="absolute inset-0 h-full w-full"
                    loading="lazy"
                    allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                {item.caption && <p className="text-sm text-muted-foreground">{item.caption}</p>}
              </div>
            </div>
          );
        })}
      </div>
      {items.length > 1 && (
        <>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -left-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 rounded-full shadow-md sm:flex"
            onClick={() => scroll(-1)}
            aria-label="Scroll videos left"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -right-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 rounded-full shadow-md sm:flex"
            onClick={() => scroll(1)}
            aria-label="Scroll videos right"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}
    </div>
  );
}
