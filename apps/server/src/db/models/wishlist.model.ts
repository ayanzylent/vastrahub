/**
 * Wishlist model.
 * Product-level only — NO skuId in wishlist items.
 */

import mongoose, { Schema, type Document, type Types } from 'mongoose';
import { APP_CONFIG } from '../../constants/index.js';

// ---------- Interfaces ----------

export interface IWishlistItem {
  productId: Types.ObjectId;
  addedAt: Date;
}

export interface IWishlistDocument extends Document {
  userId: Types.ObjectId;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

// ---------- Sub-schemas ----------

const wishlistItemSchema = new Schema<IWishlistItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    addedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { _id: false },
);

// ---------- Main schema ----------

const wishlistSchema = new Schema<IWishlistDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    items: {
      type: [wishlistItemSchema],
      default: [],
      validate: {
        validator: (items: IWishlistItem[]) => items.length <= APP_CONFIG.MAX_WISHLIST_ITEMS,
        message: `Wishlist cannot have more than ${APP_CONFIG.MAX_WISHLIST_ITEMS} items`,
      },
    },
  },
  {
    timestamps: true,
    collection: 'wishlists',
  },
);

// ---------- Indexes ----------

wishlistSchema.index({ userId: 1 }, { unique: true });
wishlistSchema.index({ 'items.productId': 1 });

// ---------- Export ----------

export const Wishlist = mongoose.models.Wishlist
  || mongoose.model<IWishlistDocument>('Wishlist', wishlistSchema);
