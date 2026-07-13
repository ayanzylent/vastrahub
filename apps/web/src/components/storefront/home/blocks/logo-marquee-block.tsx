import Link from "next/link";
import type { ILogoMarqueeBlock, ILogoMarqueeItem } from "@/types";
import { getMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { HOME_BLOCK_HEADER_CLASS, HomeBlockSection } from "./home-block-section";

type LogoItemData = ILogoMarqueeItem & { imageKey: string };

function LogoMark({ item }: { item: LogoItemData }) {
  const alt = item.alt?.trim() || "Logo";
  const darkKey = item.imageKeyDark?.trim();
  const lightSrc = getMediaUrl(item.imageKey);
  const imgClass = "h-8 w-full max-w-[7.5rem] object-contain md:h-10 md:max-w-[9rem]";

  if (darkKey) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lightSrc} alt={alt} className={cn(imgClass, "dark:hidden")} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getMediaUrl(darkKey)}
          alt={alt}
          className={cn(imgClass, "hidden dark:block")}
        />
      </>
    );
  }

  // No dark asset: invert monochrome light logos for dark backgrounds.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={lightSrc}
      alt={alt}
      className={cn(imgClass, "dark:invert")}
    />
  );
}

function LogoItem({ item }: { item: LogoItemData }) {
  const href = item.href?.trim();

  const content = (
    <div className="flex h-14 w-36 shrink-0 items-center justify-center px-5 md:h-16 md:w-44 md:px-7">
      <LogoMark item={item} />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="shrink-0 opacity-80 transition-opacity hover:opacity-100">
        {content}
      </Link>
    );
  }

  return <div className="shrink-0 opacity-80">{content}</div>;
}

function LogoRow({
  items,
  ariaHidden,
}: {
  items: LogoItemData[];
  ariaHidden?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={ariaHidden || undefined}>
      {items.map((item, i) => (
        <LogoItem key={`${item.imageKey}-${i}`} item={item} />
      ))}
    </div>
  );
}

/**
 * Infinite horizontal “Trusted by” logo strip.
 * Repeats logos so the track stays wide, then duplicates the track for a
 * seamless -50% CSS loop. Reduced-motion users get a static wrapping row.
 */
export function LogoMarqueeBlock({ block }: { block: ILogoMarqueeBlock }) {
  const c = block.config ?? { items: [] };
  const items = (c.items ?? []).filter(
    (item): item is LogoItemData =>
      typeof item.imageKey === "string" && item.imageKey.trim().length > 0,
  );

  if (items.length < 2) return null;

  // Enough copies that one half of the loop is typically wider than the viewport.
  const copies = Math.max(4, Math.ceil(12 / items.length));
  const sequence = Array.from({ length: copies }, () => items).flat();

  return (
    <HomeBlockSection>
      {c.title && (
        <div className={HOME_BLOCK_HEADER_CLASS}>
          <h2 className="font-heading text-2xl font-bold md:text-3xl">{c.title}</h2>
        </div>
      )}

      {/* Static wrap for reduced motion */}
      <div className="flex flex-wrap items-center justify-center gap-y-2 motion-safe:hidden">
        {items.map((item, i) => (
          <LogoItem key={`static-${item.imageKey}-${i}`} item={item} />
        ))}
      </div>

      {/* Infinite marquee */}
      <div
        className="group relative overflow-hidden motion-reduce:hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        }}
      >
        <div className="flex w-max animate-logo-marquee will-change-transform group-hover:paused">
          <LogoRow items={sequence} />
          <LogoRow items={sequence} ariaHidden />
        </div>
      </div>
    </HomeBlockSection>
  );
}
