# Components

Domain → feature → file. Keep `app/` routes thin (fetch + compose + SEO metadata); put UI here.

For storefront Data Cache TTLs and stale-content debugging, see [`STOREFRONT-CACHE.md`](./STOREFRONT-CACHE.md).

## Placement

| Put it in… | When… |
|---|---|
| `ui/` | shadcn/Radix primitive only |
| `common/` | Used by **2+ domains** (storefront + admin, or auth + both), or shared SEO helpers like JSON-LD / pagination |
| `storefront/<feature>/` | Customer-facing UI (commerce **and** content: about, contact, legal) |
| `admin/<feature>/` | Admin-only UI |
| `app/.../page.tsx` | Route wiring only — `generateMetadata`, server fetch, compose; no large JSX blocks |

Do **not** add a separate `public/` domain. Pages that use the shop Header/Footer belong under `(storefront)` routes and `storefront/<feature>/` components.

## Storefront SEO pattern

Catalog and content routes that need crawlable HTML follow **server page + client island**:

1. `app/(storefront)/…/page.tsx` — server component: `generateMetadata` / static `metadata`, fetch via `@/lib/storefront-fetch`, optional `<JsonLd />`, pass initial data into the client UI.
2. `components/storefront/<feature>/*-page-client.tsx` — interactive UI (filters, cart, variant picker). Prefer rendering from `initial*` props so the first HTML is not a skeleton.

Examples:

| Route | Server page | Client island |
|---|---|---|
| Product | `products/[slug]/[[...variant]]/page.tsx` | `storefront/product/product-page.tsx` |
| Category | `categories/[slug]/page.tsx` | `storefront/catalog/category-page-client.tsx` |
| Collection | `collections/[slug]/page.tsx` | `storefront/catalog/collection-page-client.tsx` |
| Shop | `shop/page.tsx` | `storefront/catalog/shop-page-client.tsx` |
| Categories index | `categories/page.tsx` | `storefront/catalog/categories-index-client.tsx` |
| Collections index | `collections/page.tsx` | `storefront/catalog/collections-index-client.tsx` |

Shared SEO UI:

- `common/json-ld.tsx` — `<script type="application/ld+json">` (built from `@/lib/structured-data`)
- `common/pagination.tsx` — crawlable `<Link>` pages when `hrefForPage` is provided

## Naming

- Files: `kebab-case.tsx` (`product-card.tsx`)
- Exports: `PascalCase` (`ProductCard`)
- Feature suffixes: `*-block.tsx`, `*-editor.tsx`, `*-form.tsx`, `*-carousel.tsx`, `*-page-client.tsx`
- No barrel `index.ts` under components (direct imports stay explicit)
- Providers stay PascalCase under `providers/`

## Import paths

```ts
@/components/ui/button
@/components/common/pagination
@/components/common/json-ld
@/components/storefront/catalog/product-card
@/components/storefront/catalog/shop-page-client
@/components/storefront/layout/header
@/components/storefront/about/about-page-content
@/components/storefront/legal/legal-page-shell
@/components/admin/layout/admin-sidebar
@/components/admin/settings/hero-editor
```
