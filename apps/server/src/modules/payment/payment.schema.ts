/**
 * Payment module TypeBox schemas.
 * Request validation for payment routes.
 */

import { Type, type Static } from '@sinclair/typebox';
import { ObjectId } from '../../schemas/common.schema.js';

export const VerifyPaymentBody = Type.Object({
  gatewayName: Type.Optional(Type.Union([Type.Literal('razorpay'), Type.Literal('icici')])),
  razorpayOrderId: Type.Optional(Type.String()),
  razorpayPaymentId: Type.Optional(Type.String()),
  razorpaySignature: Type.Optional(Type.String()),
  iciciOrderId: Type.Optional(Type.String()),
  iciciPaymentId: Type.Optional(Type.String()),
  iciciSignature: Type.Optional(Type.String()),
});
export type VerifyPaymentBodyType = Static<typeof VerifyPaymentBody>;

export const PaymentOrderIdParams = Type.Object({
  orderId: ObjectId,
});
export type PaymentOrderIdParamsType = Static<typeof PaymentOrderIdParams>;
