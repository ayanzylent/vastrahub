import Link from "next/link";
import type { IImageMosaicBlock, IImageMosaicItem } from "@/types";
import { hasResponsiveImage } from "@/lib/responsive-image";
import { cn } from "@/lib/utils";
import { ResponsivePicture } from "../responsive-picture";
import { HomeBlockSection } from "./home-block-section";

function MosaicTile({
  item,
  className,
}: {
  item: IImageMosaicItem;
  className?: string;
}) {
  if (!hasResponsiveImage(item.image)) return null;

  const title = item.title?.trim();
  const badge = item.badge?.trim();
  const href = item.href?.trim();
  const alt = item.alt?.trim() || title || "Promotional image";

  const inner = (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-muted">
      <ResponsivePicture
        image={item.image}
        alt={alt}
        className="absolute inset-0 block h-full w-full"
        imgClassName="absolute inset-0 h-full w-full object-cover"
      />

      {badge && (
        <span
          className="absolute right-0 top-3 z-10 max-w-[70%] truncate bg-primary py-1 pr-2 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm sm:text-xs"
          style={{
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%, 8px 50%)",
            paddingLeft: "14px",
          }}
        >
          {badge}
        </span>
      )}

      {title && (
        <span className="absolute inset-x-2 bottom-3 z-10 text-center font-heading text-sm font-bold uppercase tracking-wide text-primary drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)] sm:text-base md:bottom-4 md:text-lg">
          {title}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={cn("block min-h-0", className)}>
        {inner}
      </Link>
    );
  }

  return <div className={cn("min-h-0", className)}>{inner}</div>;
}

/**
 * Four promotional image tiles.
 * - Desktop (lg+): tall | stacked landscapes | tall
 * - Tablet/mobile: interlocking 2-col (tall+short | short+tall)
 */
export function ImageMosaicBlock({ block }: { block: IImageMosaicBlock }) {
  const items = block.config?.items ?? [];
  if (items.length !== 4 || !items.every((item) => hasResponsiveImage(item.image))) {
    return null;
  }

  const [leftTall, landscapeTop, landscapeBottom, rightTall] = items;

  return (
    <HomeBlockSection>
      {/* Tablet & mobile — interlocking 2 columns */}
      <div className="flex aspect-5/6 gap-2.5 sm:aspect-4/5 sm:gap-3 lg:hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 sm:gap-3">
          <MosaicTile item={leftTall} className="min-h-0 flex-2" />
          <MosaicTile item={landscapeBottom} className="min-h-0 flex-1" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 sm:gap-3">
          <MosaicTile item={landscapeTop} className="min-h-0 flex-1" />
          <MosaicTile item={rightTall} className="min-h-0 flex-2" />
        </div>
      </div>

      {/* Desktop — tall | stacked | tall */}
      <div className="hidden items-stretch gap-3 lg:flex lg:gap-4">
        <MosaicTile item={leftTall} className="aspect-3/4 w-[28%] shrink-0" />
        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:gap-4">
          <MosaicTile item={landscapeTop} className="min-h-0 flex-1" />
          <MosaicTile item={landscapeBottom} className="min-h-0 flex-1" />
        </div>
        <MosaicTile item={rightTall} className="aspect-3/4 w-[28%] shrink-0" />
      </div>
    </HomeBlockSection>
  );
}
