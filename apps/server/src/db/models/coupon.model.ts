/**
 * Coupon model.
 * Uses percentageValue + fixedAmountPaise — NOT discountValue.
 */

import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

// ---------- Interfaces ----------

export interface ICouponRules {
  minOrderPaise?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  validFrom: Date;
  validUntil: Date;
  applicableCategories?: Types.ObjectId[];
  applicableProducts?: Types.ObjectId[];
  excludedProducts?: Types.ObjectId[];
}

export interface ICouponDocument extends Document {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount';
  percentageValue?: number;
  fixedAmountPaise?: number;
  maxDiscountPaise?: number;
  rules: ICouponRules;
  currentUses: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ---------- Sub-schemas ----------

const couponRulesSchema = new Schema<ICouponRules>(
  {
    minOrderPaise: { type: Number, min: 0 },
    maxUses: { type: Number, min: 0 },
    maxUsesPerUser: { type: Number, min: 1, default: 1 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    applicableCategories: {
      type: [Schema.Types.ObjectId],
      ref: 'Category',
      default: [],
    },
    applicableProducts: {
      type: [Schema.Types.ObjectId],
      ref: 'Product',
      default: [],
    },
    excludedProducts: {
      type: [Schema.Types.ObjectId],
      ref: 'Product',
      default: [],
    },
  },
  { _id: false },
);

// ---------- Main schema ----------

const couponSchema = new Schema<ICouponDocument>(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [3, 'Coupon code must be at least 3 characters'],
      maxlength: [30, 'Coupon code cannot exceed 30 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    discountType: {
      type: String,
      required: [true, 'Discount type is required'],
      enum: {
        values: ['percentage', 'fixed_amount'],
        message: 'Discount type must be either "percentage" or "fixed_amount"',
      },
    },
    percentageValue: {
      type: Number,
      min: [0, 'Percentage must be non-negative'],
      max: [100, 'Percentage cannot exceed 100'],
    },
    fixedAmountPaise: {
      type: Number,
      min: [0, 'Fixed amount must be non-negative'],
    },
    maxDiscountPaise: {
      type: Number,
      min: [0, 'Max discount must be non-negative'],
    },
    rules: {
      type: couponRulesSchema,
      required: true,
    },
    currentUses: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'coupons',
  },
);

// ---------- Indexes ----------

couponSchema.index({ isActive: 1, 'rules.validFrom': 1, 'rules.validUntil': 1 });

// ---------- Export ----------

export const Coupon: Model<ICouponDocument> = mongoose.models.Coupon
  || mongoose.model<ICouponDocument>('Coupon', couponSchema);
