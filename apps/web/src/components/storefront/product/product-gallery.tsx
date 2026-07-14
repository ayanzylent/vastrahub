"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getMediaUrl } from "@/lib/media";
import type { IMediaItem } from "@/types";

interface ProductGalleryProps {
  productName: string;
  isFeatured?: boolean;
  mediaItems: IMediaItem[];
}

export function ProductGallery({
  productName,
  isFeatured,
  mediaItems,
}: ProductGalleryProps) {
  const [selectedMedia, setSelectedMedia] = useState<IMediaItem | null>(null);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

  const activeIndex = useMemo(
    () => Math.max(0, mediaItems.findIndex((item) => item.url === selectedMedia?.url)),
    [mediaItems, selectedMedia],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = mediaItems.findIndex((item) => item.url === selectedMedia?.url);
      if (currentIndex !== -1) {
        if (isLeftSwipe && currentIndex < mediaItems.length - 1) {
          setSelectedMedia(mediaItems[currentIndex + 1]);
        } else if (isRightSwipe && currentIndex > 0) {
          setSelectedMedia(mediaItems[currentIndex - 1]);
        }
      }
    }
    setTouchStartX(0);
    setTouchEndX(0);
  }, [touchStartX, touchEndX, mediaItems, selectedMedia]);

  // Set initial media
  useEffect(() => {
    if (mediaItems.length > 0 && !selectedMedia) {
      setSelectedMedia(mediaItems[0]);
    }
  }, [mediaItems, selectedMedia]);

  // Reset media when variant changes
  useEffect(() => {
    if (mediaItems.length > 0) {
      setSelectedMedia(mediaItems[0]);
    }
  }, [mediaItems]);

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div
        className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-card touch-pan-y select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {mediaItems.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-6xl font-heading font-bold text-primary/20">
              {productName[0]}
            </span>
          </div>
        ) : (
          <div
            className="flex w-full h-full"
            style={{
              transform: `translateX(-${activeIndex * 100}%)`,
              transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {mediaItems.map((item, idx) => (
              <div key={idx} className="relative w-full h-full shrink-0">
                {item.type === "video" ? (
                  <video
                    src={getMediaUrl(item.url)}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={getMediaUrl(item.url)}
                    alt={item.alt || productName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority={idx === 0}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isFeatured && (
            <Badge variant="secondary" className="text-[10px] shadow-sm">
              Bestseller
            </Badge>
          )}
        </div>

        {/* Swipe dot indicator (mobile) */}
        {mediaItems.length > 1 && selectedMedia && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none lg:hidden">
            {mediaItems.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === activeIndex
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-white/60",
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Row */}
      {mediaItems.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {mediaItems.map((item, i) => (
            <button
              key={i}
              onClick={() => setSelectedMedia(item)}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                selectedMedia?.url === item.url
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-transparent hover:border-primary/30",
              )}
            >
              {item.type === "video" ? (
                <div className="flex items-center justify-center h-full bg-muted text-xs">
                  ▶
                </div>
              ) : (
                <Image
                  src={getMediaUrl(item.thumbnailUrl || item.url)}
                  alt={item.alt || `${productName} ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
