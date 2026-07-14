import type { Metadata } from "next";
import { CategoriesIndexClient } from "@/components/storefront/catalog/categories-index-client";
import { BRAND_CONFIG } from "@/constants";
import { buildPageMetadata } from "@/lib/seo";
import type { ICategory } from "@/types";

export const metadata: Metadata = buildPageMetadata({
  title: "Categories",
  description: `Explore curated fashion categories at ${BRAND_CONFIG.NAME} — sarees, lehengas, kurtas, and more.`,
  path: "/categories",
});

async function getCategories(): Promise<ICategory[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${base}/api/v1/storefront/categories`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: ICategory[] };
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  return <CategoriesIndexClient initialCategories={categories} />;
}
