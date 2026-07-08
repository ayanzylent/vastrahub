/**
 * Cart model.
 * Supports both authenticated users (userId) and guest carts (guestId).
 * TTL index on expiresAt for automatic guest cart cleanup.
 */

import mongoose, { Schema, type Document, type Types } from 'mongoose';
import { APP_CONFIG } from '../../constants/index.js';

// ---------- Interfaces ----------

export interface ICartItem {
  skuId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  addedAt: Date;

  // Live computed fields (populated dynamically on the fly, not stored in DB)
  productName?: string;
  skuCode?: string;
  attributes?: Map<string, string> | Record<string, string>;
  imageUrl?: string;
  pricePaise?: number;
  mrpPaise?: number;
  variantLabel?: string;
}

export interface ICartDocument extends Document {
  userId?: Types.ObjectId | null;
  guestId?: string | null;
  items: ICartItem[];
  itemCount: number;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------- Sub-schemas ----------

const cartItemSchema = new Schema<ICartItem>(
  {
    skuId: {
      type: Schema.Types.ObjectId,
      ref: 'Sku',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Minimum quantity is 1'],
      max: [APP_CONFIG.MAX_CART_ITEM_QTY, `Maximum quantity is ${APP_CONFIG.MAX_CART_ITEM_QTY}`],
      validate: {
        validator: (v: number) => Number.isInteger(v),
        message: 'Quantity must be a whole number',
      },
    },
    addedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { _id: true },
);

// ---------- Main schema ----------

const cartSchema = new Schema<ICartDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      sparse: true,
    },
    guestId: {
      type: String,
      default: null,
      sparse: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
      validate: {
        validator: (items: ICartItem[]) => items.length <= APP_CONFIG.MAX_CART_ITEMS,
        message: `Cart cannot have more than ${APP_CONFIG.MAX_CART_ITEMS} items`,
      },
    },
    itemCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'carts',
  },
);

// ---------- Indexes ----------

cartSchema.index({ userId: 1 }, { unique: true, sparse: true });
cartSchema.index({ guestId: 1 }, { unique: true, sparse: true });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ---------- Export ----------

export const Cart = mongoose.models.Cart
  || mongoose.model<ICartDocument>('Cart', cartSchema);
