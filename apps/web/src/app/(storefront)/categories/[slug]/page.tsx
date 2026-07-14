import type { Metadata } from "next";
import { CategoryPageClient } from "@/components/storefront/catalog/category-page-client";
import { BRAND_CONFIG } from "@/constants";
import { getMediaUrl } from "@/lib/media";
import { buildPageMetadata } from "@/lib/seo";
import { fetchStorefrontCategoryBySlug } from "@/lib/storefront-fetch";
import type { ICategory } from "@/types";

interface CategoryRouteParams {
  slug: string;
}

function titleFromSlug(slug: string) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<CategoryRouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const res = await fetchStorefrontCategoryBySlug<ICategory>(slug);
  const category = res?.data;
  const fallbackName = titleFromSlug(slug);

  if (!category) {
    return buildPageMetadata({
      title: fallbackName,
      description: `Shop ${fallbackName} at ${BRAND_CONFIG.NAME}.`,
      path: `/categories/${slug}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: category.metaTitle?.trim() || category.name,
    description:
      category.metaDescription?.trim() ||
      category.description?.trim() ||
      `Shop ${category.name} at ${BRAND_CONFIG.NAME}.`,
    path: `/categories/${category.slug}`,
    image: category.image ? getMediaUrl(category.image) : null,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<CategoryRouteParams>;
}) {
  const { slug } = await params;
  const res = await fetchStorefrontCategoryBySlug<ICategory>(slug);

  return <CategoryPageClient slug={slug} initialCategory={res?.data ?? null} />;
}
