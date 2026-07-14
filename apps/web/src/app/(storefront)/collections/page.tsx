import type { Metadata } from "next";
import { CollectionsIndexClient } from "@/components/storefront/catalog/collections-index-client";
import { BRAND_CONFIG } from "@/constants";
import { buildPageMetadata } from "@/lib/seo";
import type { ICollection } from "@/types";

export const metadata: Metadata = buildPageMetadata({
  title: "Collections",
  description: `Browse curated fashion collections at ${BRAND_CONFIG.NAME}.`,
  path: "/collections",
});

async function getCollections(): Promise<ICollection[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${base}/api/v1/storefront/collections`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: ICollection[] };
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export default async function CollectionsIndexPage() {
  const collections = await getCollections();
  return <CollectionsIndexClient initialCollections={collections} />;
}
