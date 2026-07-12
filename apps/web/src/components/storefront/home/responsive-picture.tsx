import { getMediaUrl } from "@/lib/media";
import { resolveResponsiveImageKeys } from "@/lib/responsive-image";
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
  const keys = resolveResponsiveImageKeys(image);
  if (!keys) return null;

  return (
    <picture className={className}>
      <source media="(max-width: 640px)" srcSet={getMediaUrl(keys.mobile)} />
      <source media="(max-width: 1024px)" srcSet={getMediaUrl(keys.tablet)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={getMediaUrl(keys.base)} alt={alt} className={imgClassName} />
    </picture>
  );
}
