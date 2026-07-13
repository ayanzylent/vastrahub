import Link from "next/link";
import Image from "next/image";
import { getMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { ICollection } from "@/types";

type CollectionCardSize = "default" | "lg";

const TITLE_CLASS: Record<CollectionCardSize, string> = {
  default: "text-sm sm:text-base",
  lg: "text-base sm:text-lg md:text-xl",
};

const IMAGE_SIZES: Record<CollectionCardSize, string> = {
  default: "(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw",
  lg: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
};

export function CollectionCard({
  col,
  size = "default",
}: {
  col: ICollection;
  size?: CollectionCardSize;
}) {
  // Prefer card image over wide banner so the portrait tile isn't heavily cropped.
  const image = col.image || col.bannerImage;

  return (
    <Link href={`/collections/${col.slug}`} className="group block">
      <div className="relative aspect-4/5 overflow-hidden rounded-xl bg-linear-to-br from-primary/10 to-muted">
        {image ? (
          <Image
            src={getMediaUrl(image)}
            alt={col.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes={IMAGE_SIZES[size]}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-3xl font-heading font-bold text-primary/30 transition-colors group-hover:text-primary/50">
            {col.name[0]}
          </span>
        )}

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/55 via-black/20 to-transparent"
        />

        <h3
          className={cn(
            "absolute inset-x-2 bottom-3 z-10 text-center font-heading font-bold uppercase tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)] sm:bottom-4",
            TITLE_CLASS[size],
          )}
        >
          {col.name}
        </h3>
      </div>
    </Link>
  );
}
