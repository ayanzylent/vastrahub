/**
 * Cart module TypeBox schemas.
 * Request validation for all cart routes.
 */

import { Type, type Static } from '@sinclair/typebox';
import { ObjectId } from '../../schemas/common.schema.js';

// ---------- Params ----------

export const SkuIdParams = Type.Object({
  skuId: ObjectId,
});
export type SkuIdParamsType = Static<typeof SkuIdParams>;

// ---------- Body schemas ----------

export const AddCartItemBody = Type.Object({
  skuId: ObjectId,
  quantity: Type.Integer({ minimum: 1 }),
});
export type AddCartItemBodyType = Static<typeof AddCartItemBody>;

export const UpdateCartItemBody = Type.Object({
  quantity: Type.Integer({ minimum: 1 }),
});
export type UpdateCartItemBodyType = Static<typeof UpdateCartItemBody>;

export const MergeCartBody = Type.Object({
  guestId: Type.String({ minLength: 1 }),
});
export type MergeCartBodyType = Static<typeof MergeCartBody>;
