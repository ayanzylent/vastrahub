import type { IHeroConfig } from "@vastrahub/shared-types";
import { DEFAULT_HERO } from "@vastrahub/shared-constants";
import { HeroSection } from "@/components/storefront/home/hero-section";
import { HomepageBlocks } from "@/components/storefront/home/homepage-blocks";
import { CtaBanner } from "@/components/storefront/home/cta-banner";

// ISR: the hero is server-rendered and cached, regenerated at most once a minute.
export const revalidate = 60;

/**
 * Fetch the hero directly from the backend (absolute URL, no cookies) so it works
 * in a server component even when the browser-facing API is proxied. Falls back
 * to defaults if the backend is unreachable (e.g. during a build with no server).
 */
async function getHero(): Promise<IHeroConfig> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${base}/api/v1/storefront/hero`, { next: { revalidate: 60 } });
    if (!res.ok) return DEFAULT_HERO;
    const json = (await res.json()) as { data?: IHeroConfig };
    return json.data ?? DEFAULT_HERO;
  } catch {
    return DEFAULT_HERO;
  }
}

export default async function HomePage() {
  const hero = await getHero();

  return (
    <div className="flex flex-col">
      {/* Static/ISR hero */}
      <HeroSection hero={hero} />
      {/* Dynamic, admin-curated blocks (client-fetched) */}
      <HomepageBlocks />
      {/* Static promotional CTA */}
      <CtaBanner />
    </div>
  );
}
