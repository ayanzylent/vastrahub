import type { Metadata } from "next";
import { CollectionPageClient } from "@/components/storefront/catalog/collection-page-client";
import { BRAND_CONFIG } from "@/constants";
import { getMediaUrl } from "@/lib/media";
import { buildPageMetadata } from "@/lib/seo";
import { fetchStorefrontCollectionBySlug } from "@/lib/storefront-fetch";
import type { ICollection } from "@/types";

interface CollectionRouteParams {
  slug: string;
}

function titleFromSlug(slug: string) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<CollectionRouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const res = await fetchStorefrontCollectionBySlug<ICollection>(slug);
  const collection = res?.data;
  const fallbackName = titleFromSlug(slug);

  if (!collection) {
    return buildPageMetadata({
      title: fallbackName,
      description: `Explore ${fallbackName} at ${BRAND_CONFIG.NAME}.`,
      path: `/collections/${slug}`,
      noIndex: true,
    });
  }

  const image = collection.bannerImage || collection.image;

  return buildPageMetadata({
    title: collection.metaTitle?.trim() || collection.name,
    description:
      collection.metaDescription?.trim() ||
      collection.description?.trim() ||
      `Explore ${collection.name} at ${BRAND_CONFIG.NAME}.`,
    path: `/collections/${collection.slug}`,
    image: image ? getMediaUrl(image) : null,
  });
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<CollectionRouteParams>;
}) {
  const { slug } = await params;
  const res = await fetchStorefrontCollectionBySlug<ICollection>(slug);

  return <CollectionPageClient slug={slug} initialCollection={res?.data ?? null} />;
}
