/**
 * Wishlist module TypeBox schemas.
 * Request validation for wishlist routes.
 */

import { Type, type Static } from '@sinclair/typebox';
import { ObjectId } from '../../schemas/common.schema.js';

export const WishlistProductParams = Type.Object({
  productId: ObjectId,
});
export type WishlistProductParamsType = Static<typeof WishlistProductParams>;
