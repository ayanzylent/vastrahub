import type { Metadata } from "next";
import { BRAND_CONFIG } from "@/constants";

const SITE_URL = `https://${BRAND_CONFIG.DOMAIN}`;

export function getSiteUrl(): string {
  return SITE_URL;
}

export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

interface BuildPageMetadataInput {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  noIndex?: boolean;
  /** Use absolute title (skip root template). */
  absoluteTitle?: boolean;
}

/**
 * Shared Metadata builder for storefront pages (title, description, OG, Twitter, canonical).
 */
export function buildPageMetadata({
  title,
  description,
  path = "/",
  image,
  noIndex = false,
  absoluteTitle = false,
}: BuildPageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image ? absoluteUrl(image) : undefined;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: BRAND_CONFIG.NAME,
      type: "website",
      locale: "en_IN",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export const NO_INDEX_METADATA: Metadata = {
  robots: { index: false, follow: false },
};
