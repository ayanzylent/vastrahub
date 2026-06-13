/**
 * Review model.
 * CRITICAL: Uses unified media[] array (image + video), NOT images[].
 * Post-save hook recalculates parent Product's averageRating + reviewCount.
 */

import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import { softDeletePlugin, type SoftDeleteDocument } from '../plugins/soft-delete.plugin.js';

// ---------- Interfaces ----------

export interface IReviewMediaItem {
  type: 'image' | 'video';
  url: string;
  alt: string;
  sortOrder: number;
  thumbnailUrl?: string | null;
  durationSecs?: number | null;
  mimeType: string;
}

export interface IReviewDocument extends Document, SoftDeleteDocument {
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  orderId?: Types.ObjectId;
  rating: number;
  title?: string;
  body?: string;
  media: IReviewMediaItem[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  isFlagged: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------- Sub-schemas ----------

const reviewMediaSchema = new Schema<IReviewMediaItem>(
  {
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    thumbnailUrl: { type: String, default: null },
    durationSecs: { type: Number, default: null },
    mimeType: { type: String, required: true },
  },
  { _id: false },
);

// ---------- Main schema ----------

const reviewSchema = new Schema<IReviewDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    body: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    media: {
      type: [reviewMediaSchema],
      default: [],
      validate: {
        validator: (media: IReviewMediaItem[]) => media.length <= 5,
        message: 'Maximum 5 media items per review',
      },
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'reviews',
  },
);

// ---------- Indexes ----------

reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ isApproved: 1, isVerifiedPurchase: 1 });

// ---------- Plugins ----------

reviewSchema.plugin(softDeletePlugin);

// ---------- Post-save hook: Update Product's averageRating + reviewCount ----------

reviewSchema.post('save', async function (doc: IReviewDocument) {
  try {
    const ReviewModel = mongoose.model<IReviewDocument>('Review');
    const ProductModel = mongoose.model('Product');

    const aggregation = await ReviewModel.aggregate([
      {
        $match: {
          productId: doc.productId,
          isApproved: true,
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = aggregation[0] || { avgRating: 0, count: 0 };

    await ProductModel.updateOne(
      { _id: doc.productId },
      {
        $set: {
          averageRating: Math.round(stats.avgRating * 10) / 10,
          reviewCount: stats.count,
        },
      },
    );
  } catch (err) {
    console.error('Failed to update product review stats:', (err as Error).message);
  }
});

// ---------- Export ----------

export const Review: Model<IReviewDocument> = mongoose.models.Review
  || mongoose.model<IReviewDocument>('Review', reviewSchema);
