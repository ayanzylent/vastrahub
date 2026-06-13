/**
 * Coupon module TypeBox schemas.
 * Request validation for all coupon routes (admin + storefront).
 */

import { Type, type Static } from '@sinclair/typebox';
import { ObjectId, IdParams } from '../../schemas/common.schema.js';

// ---------- Admin request schemas ----------

export const CouponIdParams = IdParams;
export type CouponIdParamsType = Static<typeof CouponIdParams>;

export const CouponListQuery = Type.Object({
  page: Type.Optional(Type.String()),
  limit: Type.Optional(Type.String()),
  search: Type.Optional(Type.String()),
  status: Type.Optional(Type.String()),
});
export type CouponListQueryType = Static<typeof CouponListQuery>;

export const CreateCouponBody = Type.Object({
  code: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.String()),
  discountType: Type.Union([Type.Literal('percentage'), Type.Literal('fixed_amount')]),
  percentageValue: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
  fixedAmountPaise: Type.Optional(Type.Integer({ minimum: 0 })),
  maxDiscountPaise: Type.Optional(Type.Integer({ minimum: 0 })),
  rules: Type.Object({
    minOrderPaise: Type.Optional(Type.Integer({ minimum: 0 })),
    maxUses: Type.Optional(Type.Integer({ minimum: 1 })),
    maxUsesPerUser: Type.Optional(Type.Integer({ minimum: 1 })),
    validFrom: Type.String({ description: 'ISO 8601 date string' }),
    validUntil: Type.String({ description: 'ISO 8601 date string' }),
    applicableCategories: Type.Optional(Type.Array(ObjectId)),
    applicableProducts: Type.Optional(Type.Array(ObjectId)),
    excludedProducts: Type.Optional(Type.Array(ObjectId)),
  }),
  isActive: Type.Optional(Type.Boolean()),
});
export type CreateCouponBodyType = Static<typeof CreateCouponBody>;

export const UpdateCouponBody = Type.Partial(CreateCouponBody);
export type UpdateCouponBodyType = Static<typeof UpdateCouponBody>;

// ---------- Storefront request schemas ----------

export const ValidateCouponBody = Type.Object({
  code: Type.String({ minLength: 1 }),
  cartSubtotalPaise: Type.Integer({ minimum: 0 }),
  cartItemProductIds: Type.Optional(Type.Array(Type.String())),
});
export type ValidateCouponBodyType = Static<typeof ValidateCouponBody>;
