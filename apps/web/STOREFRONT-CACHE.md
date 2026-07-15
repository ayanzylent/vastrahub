# Storefront fetch caching

Use this when storefront content looks **stale** or **wrong after an admin edit**.
Ask: is this path using the Next.js Data Cache? If yes, wait for the TTL or trigger revalidation.

All times below are **Next.js `fetch` Data Cache** (server). Browser `api.get` / client hooks are **not** Next-cached.

## Cached (server)

| Where | Endpoint / use | Policy | Stale for up to |
|---|---|---|---|
| [`storefront-fetch.ts`](./src/lib/storefront-fetch.ts) `fetchAllProductSlugs` | `GET /storefront/products` (sitemap) | `revalidate: 3600` | 1 hour |
| [`storefront-fetch.ts`](./src/lib/storefront-fetch.ts) `fetchAllCategorySlugs` | `GET /storefront/categories` (sitemap) | `revalidate: 3600` | 1 hour |
| [`storefront-fetch.ts`](./src/lib/storefront-fetch.ts) `fetchAllCollectionSlugs` | `GET /storefront/collections` (sitemap) | `revalidate: 3600` | 1 hour |
| [`storefront-fetch.ts`](./src/lib/storefront-fetch.ts) `fetchStorefrontProductBySlug` | Product SSR + `generateMetadata` | `revalidate: 300` | 5 min |
| [`storefront-fetch.ts`](./src/lib/storefront-fetch.ts) `fetchStorefrontCategoryBySlug` | Category SSR + metadata | `revalidate: 600` | 10 min |
| [`storefront-fetch.ts`](./src/lib/storefront-fetch.ts) `fetchStorefrontCollectionBySlug` | Collection SSR + metadata | `revalidate: 600` | 10 min |
| [`storefront-fetch.ts`](./src/lib/storefront-fetch.ts) `fetchStorefrontSiteSettings` | Homepage blocks (SSR) | `revalidate: 300` + tag `storefront-site-settings` | 5 min (or until admin save busts tag) |
| [`storefront-fetch.ts`](./src/lib/storefront-fetch.ts) `fetchProductPageSettings` | PDP delivery/settings panel | `revalidate: 600` | 10 min |
| [`(storefront)/page.tsx`](./src/app/(storefront)/page.tsx) `getHero()` | Hero slides | `force-cache` + tag `storefront-hero` | Until `revalidateTag` on admin save (no periodic TTL) |
| [`(storefront)/categories/page.tsx`](./src/app/(storefront)/categories/page.tsx) | Categories index SSR | `revalidate: 600` | 10 min |
| [`(storefront)/collections/page.tsx`](./src/app/(storefront)/collections/page.tsx) | Collections index SSR | `revalidate: 600` | 10 min |

Default in `fetchJson` if a caller omits options: **`revalidate: 3600` (1 hour)**.

## Not cached by Next (always fresh from API on each request/call)

| Where | What | Notes |
|---|---|---|
| [`lib/api.ts`](./src/lib/api.ts) client `api.get` / `api.post` / … | Shop filters, cart, wishlist, client PDP refresh, listing grids | No `next.revalidate`; browser network only |
| [`use-product-listing.ts`](./src/hooks/use-product-listing.ts) | Shop / category / collection product grids | Client fetch via `api` |
| [`product-page.tsx`](./src/components/storefront/product/product-page.tsx) client `useEffect` | Soft refresh after SSR | Can show newer data than SSR HTML while SSR cache is still warm |
| [`homepage-blocks.tsx`](./src/components/storefront/home/homepage-blocks.tsx) | Legacy client blocks loader | Only if still mounted; home currently SSR via `fetchStorefrontSiteSettings` |
| Admin `revalidateHome` session check | `GET /auth/me` | Explicit `cache: "no-store"`; uses proxy-aware base URL on Vercel |

## On-demand revalidation (cache bust)

| Trigger | What it clears |
|---|---|
| Admin saves site settings → [`revalidateHome()`](./src/app/(admin)/admin/settings/actions.ts) | `revalidateTag("storefront-hero")`, `revalidateTag("storefront-site-settings")`, `revalidatePath("/")` |

Hero uses **on-demand tags only** — no periodic TTL. Between rare hero edits there is zero extra backend cost. When admin saves, cache busts immediately (if auth check passes).

**Not automatically busted:** product / category / collection slug caches, sitemap slug lists, categories/collections index. Those wait for their TTL (or a redeploy).

## Vercel notes

- `revalidateHome()` uses [`getServerApiBase()`](./src/lib/server-api.ts) so the auth check goes through the same `/api` proxy as the browser when `NEXT_PUBLIC_API_PROXY=true`.
- If cache bust fails, admin sees an explicit warning. Hero stays stale until the next deploy — there is no periodic TTL fallback.
- Image files use new R2 keys per upload (`homepages/{nanoid}`); stale hero JSON is the usual bottleneck, not image CDN cache.

## Debug checklist

1. **Wrong title/description/OG on a product** → likely `fetchStorefrontProductBySlug` (5 min). Hard-refresh alone may not help; wait or restart dev server / clear `.next` cache.
2. **Home hero outdated after admin save** → check `revalidateHome` succeeded (no warning toast). If warning appeared, auth check failed on Vercel.
3. **Home blocks outdated** → site-settings cache (5 min TTL) or failed tag bust; hero and blocks bust together on successful save.
4. **Shop grid wrong but product page OK** → grid is **not** Next-cached (client). Look at API/data, not Data Cache.
5. **Sitemap missing a new product** → product slug list cache (1 hour).
6. **Dev tip:** Next Data Cache behaves differently in `next dev` vs production; still treat TTLs as the intended production behavior.
