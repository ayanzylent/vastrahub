import type { TimestampFields } from './common.types';

/**
 * Discount type for coupons.
 */
export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

/**
 * Rules governing coupon applicability.
 */
export interface ICouponRules {
  minOrderPaise?: number;
  maxDiscountPaise?: number;
  applicableCategoryIds?: string[];
  applicableProductIds?: string[];
  excludedProductIds?: string[];
}

/**
 * Coupon document.
 * Uses `percentageValue` and `fixedAmountPaise` (NOT a generic discountValue).
 */
export interface ICoupon extends TimestampFields {
  _id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  /** Percentage discount value (0-100). Only used when discountType is PERCENTAGE. */
  percentageValue?: number;
  /** Fixed discount amount in paise. Only used when discountType is FIXED. */
  fixedAmountPaise?: number;
  rules: ICouponRules;
  usageLimit?: number;
  usageCount: number;
  perUserLimit: number;
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
}
