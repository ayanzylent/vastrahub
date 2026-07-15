/**
 * Server-side fetch helpers for storefront SEO (sitemap, generateMetadata, SSR).
 * Uses absolute backend URL so it works even when the browser API is proxied.
 *
 * Caching map (TTLs, what is NOT cached, how to debug stale content):
 * @see ../../STOREFRONT-CACHE.md
 */

import { STOREFRONT_SITE_SETTINGS_TAG } from "@/lib/server-api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface FetchJsonOptions {
  revalidate?: number | false;
  cache?: RequestCache;
  tags?: string[];
}

async function fetchJson<T>(path: string, options: FetchJsonOptions = {}): Promise<T | null> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      ...(options.cache
        ? { cache: options.cache, ...(options.tags ? { next: { tags: options.tags } } : {}) }
        : {
            next: {
              revalidate: options.revalidate ?? 3600,
              ...(options.tags ? { tags: options.tags } : {}),
            },
          }),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface StorefrontListItem {
  slug: string;
  updatedAt?: string;
  name?: string;
}

interface PaginatedBody<T> {
  success?: boolean;
  data?: T[];
  pagination?: { page: number; totalPages: number; hasNextPage?: boolean };
}

interface EntityBody<T> {
  success?: boolean;
  data?: T;
  redirect?: boolean;
  newSlug?: string;
}

interface CategoryTreeNode {
  slug: string;
  updatedAt?: string;
  children?: CategoryTreeNode[];
}

function flattenCategoryTree(nodes: CategoryTreeNode[]): StorefrontListItem[] {
  const items: StorefrontListItem[] = [];
  for (const node of nodes) {
    if (node.slug) items.push({ slug: node.slug, updatedAt: node.updatedAt });
    if (node.children?.length) items.push(...flattenCategoryTree(node.children));
  }
  return items;
}

/** Paginate through a storefront product list endpoint collecting all slugs. */
export async function fetchAllProductSlugs(limit = 100): Promise<StorefrontListItem[]> {
  const items: StorefrontListItem[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= 50) {
    const body = await fetchJson<PaginatedBody<StorefrontListItem>>(
      `/api/v1/storefront/products?page=${page}&limit=${limit}`,
      { revalidate: 3600 },
    );
    if (!body?.data?.length) break;
    items.push(...body.data.filter((item) => Boolean(item.slug)));
    totalPages = body.pagination?.totalPages ?? page;
    if (!body.pagination?.hasNextPage && page >= totalPages) break;
    page += 1;
  }

  return items;
}

/** Category tree → flat slug list. */
export async function fetchAllCategorySlugs(): Promise<StorefrontListItem[]> {
  const body = await fetchJson<{ success?: boolean; data?: CategoryTreeNode[] }>(
    "/api/v1/storefront/categories",
    { revalidate: 3600 },
  );
  if (!body?.data?.length) return [];
  return flattenCategoryTree(body.data);
}

/** Active collections list (non-paginated). */
export async function fetchAllCollectionSlugs(): Promise<StorefrontListItem[]> {
  const body = await fetchJson<{ success?: boolean; data?: StorefrontListItem[] }>(
    "/api/v1/storefront/collections?limit=100",
    { revalidate: 3600 },
  );
  if (!body?.data?.length) return [];
  return body.data.filter((item) => Boolean(item.slug));
}

export async function fetchStorefrontProductBySlug<T>(slug: string) {
  return fetchJson<EntityBody<T>>(`/api/v1/storefront/products/${encodeURIComponent(slug)}`, {
    revalidate: 300,
  });
}

export async function fetchStorefrontCategoryBySlug<T>(slug: string) {
  return fetchJson<EntityBody<T>>(`/api/v1/storefront/categories/${encodeURIComponent(slug)}`, {
    revalidate: 600,
  });
}

export async function fetchStorefrontCollectionBySlug<T>(slug: string) {
  return fetchJson<EntityBody<T>>(`/api/v1/storefront/collections/${encodeURIComponent(slug)}`, {
    revalidate: 600,
  });
}

export async function fetchStorefrontSiteSettings<T>() {
  return fetchJson<{ success?: boolean; data?: T }>("/api/v1/storefront/site-settings", {
    revalidate: 300,
    tags: [STOREFRONT_SITE_SETTINGS_TAG],
  });
}

export async function fetchProductPageSettings<T>() {
  return fetchJson<{ success?: boolean; data?: T }>("/api/v1/storefront/product-page-settings", {
    revalidate: 600,
  });
}
