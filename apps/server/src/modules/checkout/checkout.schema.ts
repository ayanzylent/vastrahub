/**
 * Checkout module TypeBox schemas.
 * Request validation for checkout routes.
 */

import { Type, type Static } from '@sinclair/typebox';
import { ObjectId } from '../../schemas/common.schema.js';

export const CreateOrderBody = Type.Object({
  addressId: ObjectId,
  paymentMethod: Type.Union([Type.Literal('razorpay'), Type.Literal('cod')]),
  couponCode: Type.Optional(Type.String()),
  customerNotes: Type.Optional(Type.String()),
});
export type CreateOrderBodyType = Static<typeof CreateOrderBody>;
