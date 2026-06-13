/**
 * Product module TypeBox schemas.
 * Request validation for all product routes (admin + storefront).
 */

import { Type, type Static } from '@sinclair/typebox';
import { ObjectId, PaginationQuery, IdParams } from '../../schemas/common.schema.js';

// ---------- Reusable fragments ----------

const VariantOptionValue = Type.Object({
  value: Type.String({ minLength: 1 }),
  label: Type.String({ minLength: 1 }),
  slug: Type.String({ minLength: 1 }),
});

const VariantOption = Type.Object({
  name: Type.String({ minLength: 1 }),
  type: Type.String({ minLength: 1 }),
  values: Type.Array(VariantOptionValue),
});

const MediaItem = Type.Object({
  type: Type.Union([Type.Literal('image'), Type.Literal('video')]),
  url: Type.String({ minLength: 1 }),
  alt: Type.String(),
  sortOrder: Type.Integer({ minimum: 0 }),
  thumbnailUrl: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  durationSecs: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
  mimeType: Type.String({ minLength: 1 }),
});

const VariantMediaItem = Type.Object({
  variantValue: Type.Union([Type.String(), Type.Null()]),
  variantLabel: Type.Union([Type.String(), Type.Null()]),
  variantSlug: Type.Union([Type.String(), Type.Null()]),
  media: Type.Array(MediaItem),
  isCoverGroup: Type.Boolean(),
});

// ---------- Admin request schemas ----------

export const CreateProductBody = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 200 }),
  description: Type.String({ minLength: 1 }),
  shortDescription: Type.Optional(Type.String()),
  categoryId: ObjectId,
  brand: Type.Optional(Type.String()),
  tags: Type.Optional(Type.Array(Type.String())),
  styleCode: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  variantOptions: Type.Optional(Type.Array(VariantOption)),
  visualAttributeName: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  showVisualSelector: Type.Optional(Type.Boolean()),
  variantMedia: Type.Optional(Type.Array(VariantMediaItem)),
  metadata: Type.Optional(Type.Object({
    metaTitle: Type.Optional(Type.Union([Type.String({ maxLength: 120 }), Type.Null()])),
    metaDescription: Type.Optional(Type.Union([Type.String({ maxLength: 320 }), Type.Null()])),
  })),
  material: Type.Optional(Type.Union([Type.String({ maxLength: 200 }), Type.Null()])),
  careInstructions: Type.Optional(Type.Union([Type.String({ maxLength: 1000 }), Type.Null()])),
  originCountry: Type.Optional(Type.String()),
  hsn: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  gstPercentage: Type.Optional(Type.Union([
    Type.Literal(0), Type.Literal(5), Type.Literal(12), Type.Literal(18), Type.Literal(28),
    Type.Null(),
  ])),
  isActive: Type.Optional(Type.Boolean()),
  isFeatured: Type.Optional(Type.Boolean()),
});
export type CreateProductBodyType = Static<typeof CreateProductBody>;

export const UpdateProductBody = Type.Intersect([
  Type.Partial(CreateProductBody),
  Type.Object({
    __v: Type.Optional(Type.Integer({ description: 'Version for optimistic concurrency control' })),
  }),
]);
export type UpdateProductBodyType = Static<typeof UpdateProductBody>;

export const ProductIdParams = IdParams;
export type ProductIdParamsType = Static<typeof ProductIdParams>;

export const ProductListQuery = Type.Object({
  page: Type.Optional(Type.String()),
  limit: Type.Optional(Type.String()),
  categoryId: Type.Optional(Type.String()),
  categorySlug: Type.Optional(Type.String()),
  status: Type.Optional(Type.String()),
  search: Type.Optional(Type.String()),
});
export type ProductListQueryType = Static<typeof ProductListQuery>;

export const SetSlugBody = Type.Object({
  slug: Type.String({ minLength: 1, maxLength: 200 }),
});
export type SetSlugBodyType = Static<typeof SetSlugBody>;

export const SlugHistoryDeleteParams = Type.Object({
  id: ObjectId,
  oldSlug: Type.String({ minLength: 1 }),
});
export type SlugHistoryDeleteParamsType = Static<typeof SlugHistoryDeleteParams>;

// ---------- Storefront request schemas ----------

export const StorefrontListQuery = Type.Object({
  page: Type.Optional(Type.String()),
  limit: Type.Optional(Type.String()),
  categoryId: Type.Optional(Type.String()),
  categorySlug: Type.Optional(Type.String()),
  minPricePaise: Type.Optional(Type.String()),
  maxPricePaise: Type.Optional(Type.String()),
  brands: Type.Optional(Type.String({ description: 'Comma-separated brand names' })),
  tags: Type.Optional(Type.String({ description: 'Comma-separated tags' })),
  inStock: Type.Optional(Type.String()),
  search: Type.Optional(Type.String()),
  sortBy: Type.Optional(Type.Union([
    Type.Literal('price_asc'),
    Type.Literal('price_desc'),
    Type.Literal('newest'),
    Type.Literal('rating'),
    Type.Literal('popularity'),
  ])),
});
export type StorefrontListQueryType = Static<typeof StorefrontListQuery>;

export const ProductSlugParams = Type.Object({
  slug: Type.String({ minLength: 1 }),
});
export type ProductSlugParamsType = Static<typeof ProductSlugParams>;

export const FeaturedQuery = Type.Object({
  limit: Type.Optional(Type.String()),
});
export type FeaturedQueryType = Static<typeof FeaturedQuery>;
