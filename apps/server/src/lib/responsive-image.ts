import type { ResponsiveImage } from '../types/index.js';

const VIEWPORTS = ['desktop', 'tablet', 'mobile'] as const;

function trimmedKey(value: string | undefined): string | undefined {
  const key = value?.trim();
  return key || undefined;
}

/** First non-empty viewport key (desktop → tablet → mobile). */
export function pickResponsiveImageKey(image?: ResponsiveImage | null): string | undefined {
  if (!image || typeof image !== 'object') return undefined;
  for (const slot of VIEWPORTS) {
    const key = trimmedKey(image[slot]);
    if (key) return key;
  }
  return undefined;
}

export function hasResponsiveImage(image?: ResponsiveImage | null): boolean {
  return pickResponsiveImageKey(image) !== undefined;
}
