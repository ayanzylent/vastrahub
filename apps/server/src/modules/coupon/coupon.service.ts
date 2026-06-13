/**
 * Coupon service — business logic for coupon operations.
 */

import mongoose from 'mongoose';
import { Coupon, Order } from '../../db/models/index.js';
import type { ICouponDocument } from '../../db/models/index.js';
import { NotFoundError, ValidationError } from '../../lib/errors.js';

// ---------- Interfaces ----------

export interface CreateCouponInput {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount';
  percentageValue?: number;
  fixedAmountPaise?: number;
  maxDiscountPaise?: number;
  rules: {
    minOrderPaise?: number;
    maxUses?: number;
    maxUsesPerUser?: number;
    validFrom: string | Date;
    validUntil: string | Date;
    applicableCategories?: string[];
    applicableProducts?: string[];
    excludedProducts?: string[];
  };
  isActive?: boolean;
}

export interface UpdateCouponInput extends Partial<CreateCouponInput> {}

export interface CouponDiscountPreview {
  valid: boolean;
  couponId?: string;
  code?: string;
  discountType?: string;
  discountAmountPaise?: number;
  message: string;
}

// ---------- Helpers ----------

function validateCouponData(data: CreateCouponInput | UpdateCouponInput): void {
  const discountType = data.discountType;

  if (discountType === 'percentage') {
    if (data.percentageValue === undefined || data.percentageValue === null) {
      throw new ValidationError('percentageValue is required for percentage discount type');
    }
  }
  if (discountType === 'fixed_amount') {
    if (data.fixedAmountPaise === undefined || data.fixedAmountPaise === null) {
      throw new ValidationError('fixedAmountPaise is required for fixed_amount discount type');
    }
  }

  const rules = data.rules;
  if (rules && rules.validFrom && rules.validUntil) {
    const from = new Date(rules.validFrom);
    const until = new Date(rules.validUntil);
    if (until <= from) {
      throw new ValidationError('validUntil must be after validFrom');
    }
  }
}

// ---------- Service functions ----------

/**
 * List coupons (admin paginated).
 * Optionally filter by isActive status and search on code/description.
 */
export async function listCoupons(
  page: number,
  limit: number,
  search?: string,
  status?: string,
) {
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  // Filter by active status if provided
  if (status === 'active') {
    filter.isActive = true;
  } else if (status === 'inactive') {
    filter.isActive = false;
  }

  // Search on code or description
  if (search) {
    filter.$or = [
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const [coupons, total] = await Promise.all([
    Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Coupon.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: coupons,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Get a single coupon by ID (admin).
 */
export async function getCouponById(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid coupon ID');
  }

  const coupon = await Coupon.findById(id).lean();
  if (!coupon) {
    throw new NotFoundError('Coupon not found');
  }

  return coupon;
}

/**
 * Create a new coupon.
 */
export async function createCoupon(data: CreateCouponInput) {
  validateCouponData(data);

  const coupon = new Coupon({
    code: data.code,
    description: data.description,
    discountType: data.discountType,
    percentageValue: data.percentageValue,
    fixedAmountPaise: data.fixedAmountPaise,
    maxDiscountPaise: data.maxDiscountPaise,
    rules: {
      minOrderPaise: data.rules.minOrderPaise,
      maxUses: data.rules.maxUses,
      maxUsesPerUser: data.rules.maxUsesPerUser ?? 1,
      validFrom: new Date(data.rules.validFrom),
      validUntil: new Date(data.rules.validUntil),
      applicableCategories: data.rules.applicableCategories?.map(
        (id) => new mongoose.Types.ObjectId(id),
      ) ?? [],
      applicableProducts: data.rules.applicableProducts?.map(
        (id) => new mongoose.Types.ObjectId(id),
      ) ?? [],
      excludedProducts: data.rules.excludedProducts?.map(
        (id) => new mongoose.Types.ObjectId(id),
      ) ?? [],
    },
    isActive: data.isActive ?? true,
  });

  await coupon.save();
  return coupon.toObject();
}

/**
 * Update an existing coupon.
 */
export async function updateCoupon(id: string, data: UpdateCouponInput) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid coupon ID');
  }

  const coupon = await Coupon.findById(id);
  if (!coupon) {
    throw new NotFoundError('Coupon not found');
  }

  // For update validation: merge existing discountType with incoming data
  const effectiveDiscountType = data.discountType ?? coupon.discountType;
  if (data.discountType !== undefined || data.percentageValue !== undefined || data.fixedAmountPaise !== undefined) {
    validateCouponData({
      ...data,
      discountType: effectiveDiscountType,
      // Carry over existing values so validation sees the complete picture
      percentageValue: data.percentageValue ?? coupon.percentageValue,
      fixedAmountPaise: data.fixedAmountPaise ?? coupon.fixedAmountPaise,
    } as CreateCouponInput);
  }

  // Validate date range if either date is being updated
  if (data.rules?.validFrom || data.rules?.validUntil) {
    const from = data.rules?.validFrom
      ? new Date(data.rules.validFrom)
      : coupon.rules.validFrom;
    const until = data.rules?.validUntil
      ? new Date(data.rules.validUntil)
      : coupon.rules.validUntil;
    if (until <= from) {
      throw new ValidationError('validUntil must be after validFrom');
    }
  }

  if (data.code !== undefined) coupon.code = data.code;
  if (data.description !== undefined) coupon.description = data.description;
  if (data.discountType !== undefined) coupon.discountType = data.discountType;
  if (data.percentageValue !== undefined) coupon.percentageValue = data.percentageValue;
  if (data.fixedAmountPaise !== undefined) coupon.fixedAmountPaise = data.fixedAmountPaise;
  if (data.maxDiscountPaise !== undefined) coupon.maxDiscountPaise = data.maxDiscountPaise;
  if (data.isActive !== undefined) coupon.isActive = data.isActive;

  if (data.rules) {
    if (data.rules.minOrderPaise !== undefined) coupon.rules.minOrderPaise = data.rules.minOrderPaise;
    if (data.rules.maxUses !== undefined) coupon.rules.maxUses = data.rules.maxUses;
    if (data.rules.maxUsesPerUser !== undefined) coupon.rules.maxUsesPerUser = data.rules.maxUsesPerUser;
    if (data.rules.validFrom !== undefined) coupon.rules.validFrom = new Date(data.rules.validFrom);
    if (data.rules.validUntil !== undefined) coupon.rules.validUntil = new Date(data.rules.validUntil);
    if (data.rules.applicableCategories !== undefined) {
      coupon.rules.applicableCategories = data.rules.applicableCategories.map(
        (cid) => new mongoose.Types.ObjectId(cid),
      );
    }
    if (data.rules.applicableProducts !== undefined) {
      coupon.rules.applicableProducts = data.rules.applicableProducts.map(
        (pid) => new mongoose.Types.ObjectId(pid),
      );
    }
    if (data.rules.excludedProducts !== undefined) {
      coupon.rules.excludedProducts = data.rules.excludedProducts.map(
        (pid) => new mongoose.Types.ObjectId(pid),
      );
    }
  }

  await coupon.save();
  return coupon.toObject();
}

/**
 * Soft-delete a coupon.
 */
export async function deleteCoupon(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid coupon ID');
  }

  const coupon = await Coupon.findById(id);
  if (!coupon) {
    throw new NotFoundError('Coupon not found');
  }

  if (typeof (coupon as ICouponDocument & { softDelete: () => Promise<void> }).softDelete === 'function') {
    await (coupon as ICouponDocument & { softDelete: () => Promise<void> }).softDelete();
  } else {
    coupon.deletedAt = new Date();
    await coupon.save();
  }

  return { deleted: true };
}

/**
 * Toggle a coupon's isActive status.
 */
export async function toggleCouponActive(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid coupon ID');
  }

  const coupon = await Coupon.findById(id);
  if (!coupon) {
    throw new NotFoundError('Coupon not found');
  }

  coupon.isActive = !coupon.isActive;
  await coupon.save();

  return coupon.toObject();
}

/**
 * Validate and preview a coupon for a storefront cart.
 * Checks coupon existence, active status, date range, min order,
 * global max uses, and per-user usage (via Order collection).
 */
export async function validateAndPreviewCoupon(
  code: string,
  cartSubtotalPaise: number,
  userId: string,
  _cartItemProductIds?: string[],
): Promise<CouponDiscountPreview> {
  // Find coupon by code (case-insensitive since code is stored uppercase)
  const coupon = await Coupon.findOne({ code: code.toUpperCase() }).lean();
  if (!coupon) {
    return { valid: false, message: 'Coupon not found' };
  }

  // Check isActive
  if (!coupon.isActive) {
    return { valid: false, message: 'This coupon is currently inactive' };
  }

  const now = new Date();

  // Check date range
  if (now < new Date(coupon.rules.validFrom)) {
    return { valid: false, message: 'This coupon is not yet valid' };
  }
  if (now > new Date(coupon.rules.validUntil)) {
    return { valid: false, message: 'This coupon has expired' };
  }

  // Check minimum order amount
  if (coupon.rules.minOrderPaise && cartSubtotalPaise < coupon.rules.minOrderPaise) {
    return {
      valid: false,
      message: `Minimum order amount of ₹${(coupon.rules.minOrderPaise / 100).toFixed(2)} required`,
    };
  }

  // Check global max uses
  if (coupon.rules.maxUses && coupon.currentUses >= coupon.rules.maxUses) {
    return { valid: false, message: 'This coupon has reached its maximum usage limit' };
  }

  // Check per-user usage via Order collection
  if (coupon.rules.maxUsesPerUser) {
    const userUsageCount = await Order.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      'couponSnapshot.code': coupon.code,
      status: { $nin: ['cancelled', 'failed'] },
    });

    if (userUsageCount >= coupon.rules.maxUsesPerUser) {
      return { valid: false, message: 'You have already used this coupon the maximum number of times' };
    }
  }

  // Calculate discount amount
  let discountAmountPaise = 0;

  if (coupon.discountType === 'percentage' && coupon.percentageValue) {
    discountAmountPaise = Math.round((cartSubtotalPaise * coupon.percentageValue) / 100);
    // Apply max discount cap if set
    if (coupon.maxDiscountPaise && discountAmountPaise > coupon.maxDiscountPaise) {
      discountAmountPaise = coupon.maxDiscountPaise;
    }
  } else if (coupon.discountType === 'fixed_amount' && coupon.fixedAmountPaise) {
    discountAmountPaise = coupon.fixedAmountPaise;
  }

  // Don't let discount exceed cart subtotal
  if (discountAmountPaise > cartSubtotalPaise) {
    discountAmountPaise = cartSubtotalPaise;
  }

  return {
    valid: true,
    couponId: String(coupon._id),
    code: coupon.code,
    discountType: coupon.discountType,
    discountAmountPaise,
    message: 'Coupon applied successfully',
  };
}
