import Link from "next/link";
import type { IBannerBlock } from "@/types";
import { hasResponsiveImage } from "@/lib/responsive-image";
import { ResponsivePicture } from "../responsive-picture";
import { HomeBlockSection } from "./home-block-section";

/**
 * A pure image banner rendered at its natural height (`h-auto`) so banners of
 * slightly different sizes are never stretched or cropped — the section simply
 * grows/shrinks to fit the uploaded art per viewport.
 */
export function BannerBlock({ block }: { block: IBannerBlock }) {
  const c = block.config ?? {};
  if (!hasResponsiveImage(c.image)) return null;

  const picture = (
    <ResponsivePicture
      image={c.image}
      alt={c.alt ?? "Banner"}
      className="block w-full"
      imgClassName="block w-full h-auto"
    />
  );

  return (
    <HomeBlockSection>
      {c.href?.trim() ? (
        <Link href={c.href.trim()} className="block overflow-hidden rounded-xl">
          {picture}
        </Link>
      ) : (
        <div className="overflow-hidden rounded-xl">{picture}</div>
      )}
    </HomeBlockSection>
  );
}
