import type { Metadata } from "next";
import type { IHeroConfig, IHydratedSiteSettings } from "@/types";
import { BRAND_CONFIG, DEFAULT_HERO } from "@/constants";
import { JsonLd } from "@/components/common/json-ld";
import { HeroSection } from "@/components/storefront/home/hero-section";
import { BlockRenderer } from "@/components/storefront/home/block-renderer";
import { buildPageMetadata } from "@/lib/seo";
import { fetchStorefrontSiteSettings } from "@/lib/storefront-fetch";
import { getServerApiBase, STOREFRONT_HERO_TAG } from "@/lib/server-api";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = buildPageMetadata({
  title: BRAND_CONFIG.META_TITLE,
  description: BRAND_CONFIG.META_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

/**
 * Fetch the hero directly from the backend (absolute URL, no cookies) so it works
 * in a server component even when the browser-facing API is proxied. Falls back
 * to defaults if the backend is unreachable (e.g. during a build with no server).
 * Cached indefinitely with tag `storefront-hero` until on-demand revalidation
 * (`revalidateTag` from admin save). No periodic TTL — bust only when hero changes.
 * @see ../../../STOREFRONT-CACHE.md
 */
async function getHero(): Promise<IHeroConfig> {
  const base = await getServerApiBase();
  try {
    const res = await fetch(`${base}/api/v1/storefront/hero`, {
      cache: "force-cache",
      next: { tags: [STOREFRONT_HERO_TAG] },
    });
    if (!res.ok) return DEFAULT_HERO;
    const json = (await res.json()) as { data?: IHeroConfig };
    return json.data ?? DEFAULT_HERO;
  } catch {
    return DEFAULT_HERO;
  }
}

export default async function HomePage() {
  const [hero, settingsRes] = await Promise.all([
    getHero(),
    fetchStorefrontSiteSettings<IHydratedSiteSettings>(),
  ]);

  const blocks = settingsRes?.data?.homepageBlocks ?? [];

  return (
    <div className="flex flex-col">
      <JsonLd data={buildOrganizationJsonLd()} />
      <JsonLd data={buildWebSiteJsonLd()} />
      <HeroSection hero={hero} />
      <BlockRenderer blocks={blocks} />
    </div>
  );
}
