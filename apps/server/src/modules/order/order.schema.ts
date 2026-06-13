/**
 * Order module TypeBox schemas.
 * Request validation for all order routes (customer + admin).
 */

import { Type, type Static } from '@sinclair/typebox';
import { ObjectId, IdParams } from '../../schemas/common.schema.js';

// ---------- Common ----------

export const OrderIdParams = IdParams;
export type OrderIdParamsType = Static<typeof OrderIdParams>;

// ---------- Customer request schemas ----------

export const OrderListQuery = Type.Object({
  page: Type.Optional(Type.String()),
  limit: Type.Optional(Type.String()),
  status: Type.Optional(Type.String()),
});
export type OrderListQueryType = Static<typeof OrderListQuery>;

export const CancelOrderBody = Type.Optional(Type.Object({
  reason: Type.Optional(Type.String()),
}));
export type CancelOrderBodyType = Static<typeof CancelOrderBody>;

export const ReturnRequestBody = Type.Object({
  reason: Type.String({ minLength: 1 }),
});
export type ReturnRequestBodyType = Static<typeof ReturnRequestBody>;

// ---------- Admin request schemas ----------

export const AdminOrderListQuery = Type.Object({
  page: Type.Optional(Type.String()),
  limit: Type.Optional(Type.String()),
  search: Type.Optional(Type.String()),
  status: Type.Optional(Type.String()),
  sortBy: Type.Optional(Type.String()),
});
export type AdminOrderListQueryType = Static<typeof AdminOrderListQuery>;

export const UpdateOrderStatusBody = Type.Object({
  status: Type.String({ minLength: 1 }),
  note: Type.Optional(Type.String()),
});
export type UpdateOrderStatusBodyType = Static<typeof UpdateOrderStatusBody>;

export const UpdateShippingBody = Type.Object({
  carrier: Type.Optional(Type.String()),
  trackingNumber: Type.Optional(Type.String()),
  trackingUrl: Type.Optional(Type.String()),
  estimatedDelivery: Type.Optional(Type.String()),
});
export type UpdateShippingBodyType = Static<typeof UpdateShippingBody>;

export const RefundBody = Type.Object({
  amountPaise: Type.Integer({ minimum: 1 }),
  reason: Type.String({ minLength: 1 }),
});
export type RefundBodyType = Static<typeof RefundBody>;
