/**
 * Category module TypeBox schemas.
 * Request validation for all category routes (admin + storefront).
 */

import { Type, type Static } from '@sinclair/typebox';
import { ObjectId, PaginationQuery, IdParams } from '../../schemas/common.schema.js';

// ---------- Admin request schemas ----------

export const CreateCategoryBody = Type.Object({
  name: Type.String({ minLength: 2, maxLength: 100 }),
  parentId: Type.Optional(Type.Union([ObjectId, Type.Null()])),
  description: Type.Optional(Type.Union([Type.String({ maxLength: 500 }), Type.Null()])),
  image: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  isActive: Type.Optional(Type.Boolean()),
  isFeatured: Type.Optional(Type.Boolean()),
  sortOrder: Type.Optional(Type.Integer({ minimum: 0 })),
  metadata: Type.Optional(Type.Object({
    metaTitle: Type.Optional(Type.Union([Type.String({ maxLength: 120 }), Type.Null()])),
    metaDescription: Type.Optional(Type.Union([Type.String({ maxLength: 320 }), Type.Null()])),
  })),
});
export type CreateCategoryBodyType = Static<typeof CreateCategoryBody>;

export const UpdateCategoryBody = Type.Partial(CreateCategoryBody);
export type UpdateCategoryBodyType = Static<typeof UpdateCategoryBody>;

export const CategoryIdParams = IdParams;
export type CategoryIdParamsType = Static<typeof CategoryIdParams>;

export const CategoryListQuery = PaginationQuery;
export type CategoryListQueryType = Static<typeof CategoryListQuery>;

// ---------- Storefront request schemas ----------

export const CategorySlugParams = Type.Object({
  slug: Type.String({ minLength: 1 }),
});
export type CategorySlugParamsType = Static<typeof CategorySlugParams>;
