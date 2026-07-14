# Components

Domain → feature → file. Keep `app/` routes thin (fetch + compose); put UI here.

## Placement

| Put it in… | When… |
|---|---|
| `ui/` | shadcn/Radix primitive only |
| `common/` | Used by **2+ domains** (storefront + admin, or auth + both) |
| `storefront/<feature>/` | Storefront-only UI |
| `admin/<feature>/` | Admin-only UI |
| `app/.../page.tsx` | Route wiring only — no large JSX blocks |

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
@/components/admin/layout/admin-sidebar
@/components/admin/settings/hero-editor
```
