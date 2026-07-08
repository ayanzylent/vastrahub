import { getMediaUrl } from "@/lib/media";
import type { ResponsiveImage } from "@/types";

/**
 * Renders a per-viewport banner image via a real `<picture>` element so the
 * browser serves the desktop / tablet / mobile art appropriate to the screen
 * (art direction). Desktop is the base; tablet/mobile fall back to it.
 */
export function ResponsivePicture({
  image,
  alt,
  className,
  imgClassName,
}: {
  image?: ResponsiveImage;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const base = image?.desktop || image?.tablet || image?.mobile;
  if (!base) return null;

  const tablet = image?.tablet || base;
  const mobile = image?.mobile || base;

  return (
    <picture className={className}>
      <source media="(max-width: 640px)" srcSet={getMediaUrl(mobile)} />
      <source media="(max-width: 1024px)" srcSet={getMediaUrl(tablet)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={getMediaUrl(base)} alt={alt} className={imgClassName} />
    </picture>
  );
}
