/**
 * Collection module TypeBox schemas.
 * Request validation for all collection routes (admin + storefront).
 */

import { Type, type Static } from '@sinclair/typebox';
import { ObjectId, PaginationQuery, IdParams } from '../../schemas/common.schema.js';

// ---------- Reusable fragments ----------

const CollectionRule = Type.Object({
  field: Type.Union([
    Type.Literal('tag'),
    Type.Literal('price'),
    Type.Literal('category'),
    Type.Literal('rating'),
    Type.Literal('featured'),
    Type.Literal('newerThanDays'),
  ]),
  operator: Type.Union([
    Type.Literal('eq'),
    Type.Literal('ne'),
    Type.Literal('lt'),
    Type.Literal('lte'),
    Type.Literal('gt'),
    Type.Literal('gte'),
  ]),
  value: Type.Union([Type.String(), Type.Number(), Type.Boolean()]),
});

const CollectionMetadata = Type.Object({
  metaTitle: Type.Optional(Type.Union([Type.String({ maxLength: 120 }), Type.Null()])),
  metaDescription: Type.Optional(Type.Union([Type.String({ maxLength: 320 }), Type.Null()])),
});

const SortByEnum = Type.Union([
  Type.Literal('price_asc'),
  Type.Literal('price_desc'),
  Type.Literal('newest'),
  Type.Literal('rating'),
]);

// ---------- Admin request schemas ----------

export const CreateCollectionBody = Type.Object({
  name: Type.String({ minLength: 2, maxLength: 120 }),
  type: Type.Optional(Type.Union([Type.Literal('manual'), Type.Literal('automated')])),
  description: Type.Optional(Type.Union([Type.String({ maxLength: 500 }), Type.Null()])),
  image: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  bannerImage: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  productIds: Type.Optional(Type.Array(ObjectId)),
  rules: Type.Optional(Type.Array(CollectionRule)),
  matchMode: Type.Optional(Type.Union([Type.Literal('all'), Type.Literal('any')])),
  isActive: Type.Optional(Type.Boolean()),
  isFeatured: Type.Optional(Type.Boolean()),
  sortOrder: Type.Optional(Type.Integer({ minimum: 0 })),
  metadata: Type.Optional(CollectionMetadata),
});
export type CreateCollectionBodyType = Static<typeof CreateCollectionBody>;

export const UpdateCollectionBody = Type.Partial(CreateCollectionBody);
export type UpdateCollectionBodyType = Static<typeof UpdateCollectionBody>;

export const CollectionIdParams = IdParams;
export type CollectionIdParamsType = Static<typeof CollectionIdParams>;

export const CollectionListQuery = PaginationQuery;
export type CollectionListQueryType = Static<typeof CollectionListQuery>;

/** Body for previewing an unsaved collection draft. */
export const CollectionPreviewDraftBody = Type.Object({
  type: Type.Optional(Type.Union([Type.Literal('manual'), Type.Literal('automated')])),
  productIds: Type.Optional(Type.Array(ObjectId)),
  rules: Type.Optional(Type.Array(CollectionRule)),
  matchMode: Type.Optional(Type.Union([Type.Literal('all'), Type.Literal('any')])),
  page: Type.Optional(Type.Integer({ minimum: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1 })),
});
export type CollectionPreviewDraftBodyType = Static<typeof CollectionPreviewDraftBody>;

/** Filters for the admin product-preview endpoint. */
export const CollectionPreviewQuery = Type.Object({
  page: Type.Optional(Type.String()),
  limit: Type.Optional(Type.String()),
  search: Type.Optional(Type.String()),
  minPricePaise: Type.Optional(Type.String()),
  maxPricePaise: Type.Optional(Type.String()),
  inStock: Type.Optional(Type.String()),
  sortBy: Type.Optional(SortByEnum),
});
export type CollectionPreviewQueryType = Static<typeof CollectionPreviewQuery>;

// ---------- Storefront request schemas ----------

export const CollectionSlugParams = Type.Object({
  slug: Type.String({ minLength: 1 }),
});
export type CollectionSlugParamsType = Static<typeof CollectionSlugParams>;

/** List active collections; `featured=true` limits to homepage-featured ones. */
export const StorefrontCollectionListQuery = Type.Object({
  featured: Type.Optional(Type.String()),
  limit: Type.Optional(Type.String()),
});
export type StorefrontCollectionListQueryType = Static<typeof StorefrontCollectionListQuery>;

/** Storefront filters/sort/pagination for products within a collection. */
export const CollectionProductsQuery = Type.Object({
  page: Type.Optional(Type.String()),
  limit: Type.Optional(Type.String()),
  minPricePaise: Type.Optional(Type.String()),
  maxPricePaise: Type.Optional(Type.String()),
  inStock: Type.Optional(Type.String()),
  search: Type.Optional(Type.String()),
  tags: Type.Optional(Type.String({ description: 'Comma-separated tags (e.g. color labels)' })),
  sortBy: Type.Optional(SortByEnum),
});
export type CollectionProductsQueryType = Static<typeof CollectionProductsQuery>;
