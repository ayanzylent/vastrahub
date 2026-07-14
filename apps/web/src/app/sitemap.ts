import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import {
  fetchAllCategorySlugs,
  fetchAllCollectionSlugs,
  fetchAllProductSlugs,
} from "@/lib/storefront-fetch";

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/shop", changeFrequency: "daily", priority: 0.9 },
  { path: "/categories", changeFrequency: "weekly", priority: 0.8 },
  { path: "/collections", changeFrequency: "weekly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/legal", changeFrequency: "monthly", priority: 0.3 },
  { path: "/legal/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/legal/returns", changeFrequency: "yearly", priority: 0.2 },
  { path: "/legal/shipping", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const [products, categories, collections] = await Promise.all([
    fetchAllProductSlugs(),
    fetchAllCategorySlugs(),
    fetchAllCollectionSlugs(),
  ]);

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(`/products/${p.slug}`),
    lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: absoluteUrl(`/categories/${c.slug}`),
    lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const collectionEntries: MetadataRoute.Sitemap = collections.map((c) => ({
    url: absoluteUrl(`/collections/${c.slug}`),
    lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...categoryEntries, ...collectionEntries, ...productEntries];
}
