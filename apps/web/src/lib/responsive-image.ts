import type { ResponsiveImage } from "@/types";

const VIEWPORTS = ["desktop", "tablet", "mobile"] as const;

function trimmedKey(value: string | undefined): string | undefined {
  const key = value?.trim();
  return key || undefined;
}

/** First non-empty viewport key (desktop → tablet → mobile). */
export function pickResponsiveImageKey(image?: ResponsiveImage | null): string | undefined {
  if (!image || typeof image !== "object") return undefined;
  for (const slot of VIEWPORTS) {
    const key = trimmedKey(image[slot]);
    if (key) return key;
  }
  return undefined;
}

export function hasResponsiveImage(image?: ResponsiveImage | null): boolean {
  return pickResponsiveImageKey(image) !== undefined;
}

/** Per-viewport keys with tablet/mobile falling back to the base art. */
export function resolveResponsiveImageKeys(image?: ResponsiveImage | null): {
  base: string;
  tablet: string;
  mobile: string;
} | null {
  if (!image || typeof image !== "object") return null;

  const desktop = trimmedKey(image.desktop);
  const tablet = trimmedKey(image.tablet);
  const mobile = trimmedKey(image.mobile);
  const base = desktop || tablet || mobile;
  if (!base) return null;

  return {
    base,
    tablet: tablet || base,
    mobile: mobile || base,
  };
}
