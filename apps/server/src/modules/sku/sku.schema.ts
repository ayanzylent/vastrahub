/**
 * SKU module TypeBox schemas.
 * Request validation for all SKU routes (admin).
 */

import { Type, type Static } from '@sinclair/typebox';
import { ObjectId, IdParams } from '../../schemas/common.schema.js';

// ---------- Params ----------

export const SkuIdParams = IdParams;
export type SkuIdParamsType = Static<typeof SkuIdParams>;

export const ProductIdParams = Type.Object({
  productId: ObjectId,
});
export type ProductIdParamsType = Static<typeof ProductIdParams>;

// ---------- Body schemas ----------

export const CreateSkuBody = Type.Object({
  sku: Type.String({ minLength: 1 }),
  barcode: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  attributes: Type.Record(Type.String(), Type.String()),
  pricePaise: Type.Integer({ minimum: 1 }),
  mrpPaise: Type.Integer({ minimum: 1 }),
  costPricePaise: Type.Optional(Type.Union([Type.Integer({ minimum: 0 }), Type.Null()])),
  stockQuantity: Type.Integer({ minimum: 0 }),
  lowStockThreshold: Type.Optional(Type.Integer({ minimum: 0 })),
  weight: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
  dimensions: Type.Optional(Type.Object({
    lengthCm: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
    widthCm: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
    heightCm: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
  })),
  isDefault: Type.Optional(Type.Boolean()),
  isActive: Type.Optional(Type.Boolean()),
});
export type CreateSkuBodyType = Static<typeof CreateSkuBody>;

export const UpdateSkuBody = Type.Intersect([
  Type.Partial(CreateSkuBody),
  Type.Object({
    __v: Type.Optional(Type.Integer()),
  }),
]);
export type UpdateSkuBodyType = Static<typeof UpdateSkuBody>;

export const UpdateStockBody = Type.Object({
  quantity: Type.Integer({ minimum: 0 }),
});
export type UpdateStockBodyType = Static<typeof UpdateStockBody>;

export const GenerateSkuCodeBody = Type.Object({
  attributes: Type.Optional(Type.Record(Type.String(), Type.String())),
});
export type GenerateSkuCodeBodyType = Static<typeof GenerateSkuCodeBody>;
