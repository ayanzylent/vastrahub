import Link from "next/link";
import Image from "next/image";
import { getMediaUrl } from "@/lib/media";
import type { ICollection } from "@/types";

export function CollectionCard({ col }: { col: ICollection }) {
  const image = col.bannerImage || col.image;

  return (
    <Link href={`/collections/${col.slug}`} className="group block">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-linear-to-br from-primary/10 to-muted">
        {image ? (
          <Image
            src={getMediaUrl(image)}
            alt={col.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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

        <h3 className="absolute inset-x-2 bottom-3 z-10 text-center font-heading text-sm font-bold uppercase tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)] sm:bottom-4 sm:text-base md:text-lg">
          {col.name}
        </h3>
      </div>
    </Link>
  );
}
