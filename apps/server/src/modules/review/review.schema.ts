/**
 * Review module TypeBox schemas.
 * Request validation for all review routes (storefront + customer + admin).
 */

import { Type, type Static } from '@sinclair/typebox';
import { ObjectId, IdParams } from '../../schemas/common.schema.js';

// ---------- Params ----------

export const ReviewIdParams = IdParams;
export type ReviewIdParamsType = Static<typeof ReviewIdParams>;

export const ProductReviewsParams = Type.Object({
  productId: ObjectId,
});
export type ProductReviewsParamsType = Static<typeof ProductReviewsParams>;

// ---------- Query schemas ----------

export const ProductReviewsQuery = Type.Object({
  page: Type.Optional(Type.String()),
  limit: Type.Optional(Type.String()),
  sortBy: Type.Optional(Type.String()),
});
export type ProductReviewsQueryType = Static<typeof ProductReviewsQuery>;

export const AdminReviewListQuery = Type.Object({
  page: Type.Optional(Type.String()),
  limit: Type.Optional(Type.String()),
  status: Type.Optional(Type.String()),
  productId: Type.Optional(Type.String()),
});
export type AdminReviewListQueryType = Static<typeof AdminReviewListQuery>;

// ---------- Body schemas ----------

const ReviewMedia = Type.Object({
  type: Type.Union([Type.Literal('image'), Type.Literal('video')]),
  url: Type.String({ minLength: 1 }),
  alt: Type.String({ default: '' }),
  sortOrder: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
  thumbnailUrl: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  durationSecs: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
  mimeType: Type.String({ minLength: 1 }),
});

export const CreateReviewBody = Type.Object({
  productId: ObjectId,
  rating: Type.Integer({ minimum: 1, maximum: 5 }),
  title: Type.Optional(Type.String()),
  body: Type.Optional(Type.String()),
  media: Type.Optional(Type.Array(ReviewMedia)),
  orderId: Type.Optional(ObjectId),
});
export type CreateReviewBodyType = Static<typeof CreateReviewBody>;

export const UpdateReviewBody = Type.Object({
  title: Type.Optional(Type.String()),
  body: Type.Optional(Type.String()),
  rating: Type.Optional(Type.Integer({ minimum: 1, maximum: 5 })),
  media: Type.Optional(Type.Array(ReviewMedia)),
});
export type UpdateReviewBodyType = Static<typeof UpdateReviewBody>;
