/**
 * Order model.
 * Immutable order snapshots with status machine validation.
 */

import mongoose, { Schema, type Document, type Types } from 'mongoose';

// ---------- Interfaces ----------

export interface IOrderItem {
  productId: Types.ObjectId;
  skuId: Types.ObjectId;
  productName: string;
  skuCode: string;
  variantLabel: string;
  attributes: Map<string, string>;
  imageUrl?: string;
  quantity: number;
  pricePaise: number;
  mrpPaise: number;
  totalPaise: number;
  gstPercentage: number;
  gstAmountPaise: number;
}

export interface IOrderPricing {
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
}

export interface ICouponSnapshot {
  code: string;
  discountType: string;
  percentageValue?: number;
  fixedAmountPaise?: number;
  discountAmountPaise: number;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IStatusHistoryEntry {
  status: string;
  changedAt: Date;
  changedBy: string;
  note?: string;
}

export interface IShippingInfo {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface IOrderDocument extends Document {
  orderNumber: string;
  userId: Types.ObjectId;
  items: IOrderItem[];
  pricing: IOrderPricing;
  couponSnapshot?: ICouponSnapshot;
  shippingAddress: IShippingAddress;
  billingAddress?: IShippingAddress;
  status: string;
  statusHistory: IStatusHistoryEntry[];
  shipping?: IShippingInfo;
  paymentId?: Types.ObjectId;
  customerNotes?: string;
  adminNotes?: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---------- Sub-schemas ----------

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    skuId: { type: Schema.Types.ObjectId, ref: 'Sku', required: true },
    productName: { type: String, required: true },
    skuCode: { type: String, required: true },
    variantLabel: { type: String, required: true },
    attributes: { type: Map, of: String, default: new Map() },
    imageUrl: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    pricePaise: { type: Number, required: true, min: 0 },
    mrpPaise: { type: Number, required: true, min: 0 },
    totalPaise: { type: Number, required: true, min: 0 },
    gstPercentage: { type: Number, required: true, default: 0 },
    gstAmountPaise: { type: Number, required: true, default: 0, min: 0 },
  },
  { _id: false },
);

const orderPricingSchema = new Schema<IOrderPricing>(
  {
    subtotalPaise: { type: Number, required: true, min: 0 },
    discountPaise: { type: Number, required: true, default: 0, min: 0 },
    shippingPaise: { type: Number, required: true, default: 0, min: 0 },
    taxPaise: { type: Number, required: true, default: 0, min: 0 },
    totalPaise: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const couponSnapshotSchema = new Schema<ICouponSnapshot>(
  {
    code: { type: String, required: true },
    discountType: { type: String, required: true },
    percentageValue: { type: Number },
    fixedAmountPaise: { type: Number },
    discountAmountPaise: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
  },
  { _id: false },
);

const statusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: { type: String, required: true },
    changedAt: { type: Date, required: true, default: () => new Date() },
    changedBy: { type: String, required: true },
    note: { type: String },
  },
  { _id: false },
);

const shippingInfoSchema = new Schema<IShippingInfo>(
  {
    carrier: { type: String },
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    estimatedDelivery: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { _id: false },
);

// ---------- Main schema ----------

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: 'Order must have at least one item',
      },
    },
    pricing: {
      type: orderPricingSchema,
      required: true,
    },
    couponSnapshot: {
      type: couponSnapshotSchema,
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    billingAddress: {
      type: shippingAddressSchema,
    },
    status: {
      type: String,
      required: true,
      default: 'pending',
      enum: [
        'pending', 'confirmed', 'processing', 'shipped',
        'delivered', 'cancelled', 'return_requested', 'returned', 'failed',
      ],
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    shipping: {
      type: shippingInfoSchema,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      sparse: true,
    },
    customerNotes: { type: String, maxlength: 500 },
    adminNotes: { type: String, maxlength: 1000 },
    idempotencyKey: {
      type: String,
      sparse: true,
    },
  },
  {
    timestamps: true,
    collection: 'orders',
  },
);

// ---------- Indexes ----------

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
orderSchema.index({ 'items.productId': 1 });
orderSchema.index({ paymentId: 1 }, { sparse: true });
orderSchema.index({ createdAt: -1 });

// ---------- Export ----------

export const Order = mongoose.models.Order
  || mongoose.model<IOrderDocument>('Order', orderSchema);
