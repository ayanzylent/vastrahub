/**
 * Payment module TypeBox schemas.
 * Request validation for payment routes.
 */

import { Type, type Static } from '@sinclair/typebox';
import { ObjectId } from '../../schemas/common.schema.js';

export const VerifyPaymentBody = Type.Object({
  razorpayOrderId: Type.String({ minLength: 1 }),
  razorpayPaymentId: Type.String({ minLength: 1 }),
  razorpaySignature: Type.String({ minLength: 1 }),
});
export type VerifyPaymentBodyType = Static<typeof VerifyPaymentBody>;

export const PaymentOrderIdParams = Type.Object({
  orderId: ObjectId,
});
export type PaymentOrderIdParamsType = Static<typeof PaymentOrderIdParams>;
