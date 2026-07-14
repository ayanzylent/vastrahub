# Components

Domain → feature → file. Keep `app/` routes thin (fetch + compose); put UI here.

## Placement

| Put it in… | When… |
|---|---|
| `ui/` | shadcn/Radix primitive only |
| `common/` | Used by **2+ domains** (storefront + admin, or auth + both) |
| `storefront/<feature>/` | Customer-facing UI (commerce **and** content: about, contact, legal) |
| `admin/<feature>/` | Admin-only UI |
| `app/.../page.tsx` | Route wiring only — no large JSX blocks |

Do **not** add a separate `public/` domain. Pages that use the shop Header/Footer belong under `(storefront)` routes and `storefront/<feature>/` components.

## Naming

- Files: `kebab-case.tsx` (`product-card.tsx`)
- Exports: `PascalCase` (`ProductCard`)
- Feature suffixes: `*-block.tsx`, `*-editor.tsx`, `*-form.tsx`, `*-carousel.tsx`
- No barrel `index.ts` under components (direct imports stay explicit)
- Providers stay PascalCase under `providers/`

## Import paths

```ts
@/components/ui/button
@/components/common/pagination
@/components/storefront/catalog/product-card
@/components/storefront/layout/header
@/components/storefront/about/about-page-content
@/components/storefront/legal/legal-page-shell
@/components/admin/layout/admin-sidebar
@/components/admin/settings/hero-editor
```
