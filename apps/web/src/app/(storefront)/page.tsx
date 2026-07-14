import type { IHeroConfig } from "@/types";
import { DEFAULT_HERO } from "@/constants";
import { HeroSection } from "@/components/storefront/home/hero-section";
import { HomepageBlocks } from "@/components/storefront/home/homepage-blocks";

/**
 * Fetch the hero directly from the backend (absolute URL, no cookies) so it works
 * in a server component even when the browser-facing API is proxied. Falls back
 * to defaults if the backend is unreachable (e.g. during a build with no server).
 * Cached until on-demand revalidation (e.g. revalidatePath("/") from admin).
 */
async function getHero(): Promise<IHeroConfig> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${base}/api/v1/storefront/hero`, { cache: "force-cache" });
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
      <HeroSection hero={hero} />
      {/* Dynamic, admin-curated blocks (client-fetched) */}
      <HomepageBlocks />
    </div>
  );
}
