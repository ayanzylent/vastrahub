import Link from "next/link";
import type { IBannerBlock } from "@/types";
import { ResponsivePicture } from "../responsive-picture";

/**
 * A pure image banner rendered at its natural height (`h-auto`) so banners of
 * slightly different sizes are never stretched or cropped — the section simply
 * grows/shrinks to fit the uploaded art per viewport.
 */
export function BannerBlock({ block }: { block: IBannerBlock }) {
  const c = block.config;
  const hasImage = !!(c.image?.desktop || c.image?.tablet || c.image?.mobile);
  if (!hasImage) return null;

  const picture = (
    <ResponsivePicture
      image={c.image}
      alt={c.alt ?? "Banner"}
      className="block w-full"
      imgClassName="block w-full h-auto"
    />
  );

  return (
    <section className="py-6 md:py-8">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {c.href ? (
          <Link href={c.href} className="block overflow-hidden rounded-xl">
            {picture}
          </Link>
        ) : (
          <div className="overflow-hidden rounded-xl">{picture}</div>
        )}
      </div>
    </section>
  );
}
