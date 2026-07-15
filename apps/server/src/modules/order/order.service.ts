/**
 * Order service — business logic for order operations.
 * Customer: list, view, cancel, return-request.
 * Admin: list-all, view, status-update, shipping-update, refund.
 */

import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Order, Payment } from '../../db/models/index.js';
import type { IOrderDocument, IPaymentDocument } from '../../db/models/index.js';
import { NotFoundError, ValidationError } from '../../lib/errors.js';
import { isValidOrderTransition, type OrderStatusType, APP_CONFIG } from '../../constants/index.js';
import { resolveOrderInventoryOnFailure } from '../inventory/inventory.service.js';

// ---------- Helpers ----------

/** Payment must be settled before customer or admin may cancel. */
const FINAL_PAYMENT_STATUSES = new Set(['captured', 'authorized']);

function assertPaymentFinalForCancel(payment: IPaymentDocument | null): void {
  if (!payment || !FINAL_PAYMENT_STATUSES.has(payment.status)) {
    throw new ValidationError(
      'Cannot cancel order until payment is completed. Unpaid orders expire or fail automatically.',
    );
  }
}

/** Alphanumeric charset for order number generation (A-Z, 0-9 — no special chars). */
const ORDER_NUM_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Total length of the generated order number.
 * Kept at 10 so it fits inside ICICI's 20-char merchantTxnNo limit
 * even after the ICICI prefix is prepended.
 */
const ORDER_NUM_LENGTH = 10;

/**
 * Generate a unique order number: 10 crypto-random alphanumeric characters.
 * No prefix, no special characters — purely A-Z + 0-9.
 * Collision space: 36^10 ≈ 3.6 trillion combinations.
 */
export function generateOrderNumber(): string {
  const bytes = crypto.randomBytes(ORDER_NUM_LENGTH);
  let result = '';
  for (let i = 0; i < ORDER_NUM_LENGTH; i++) {
    result += ORDER_NUM_CHARSET[bytes[i]! % ORDER_NUM_CHARSET.length];
  }
  return result;
}

/**
 * Validate that order pricing components add up correctly.
 * Moved from the pre('save') hook to be called explicitly.
 */
export function validateOrderPricing(pricing: {
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
}): void {
  const expected = pricing.subtotalPaise - pricing.discountPaise + pricing.shippingPaise + pricing.taxPaise;
  if (pricing.totalPaise !== expected) {
    throw new ValidationError(
      `Pricing total mismatch: totalPaise (${pricing.totalPaise}) ≠ subtotal (${pricing.subtotalPaise}) - discount (${pricing.discountPaise}) + shipping (${pricing.shippingPaise}) + tax (${pricing.taxPaise}) = ${expected}`,
    );
  }
}

// ---------- Customer functions ----------

/**
 * List orders for a specific user with pagination and optional status filter.
 */
export async function listUserOrders(
  userId: string,
  page: number,
  limit: number,
  status?: string,
) {
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
  };
  if (status) {
    filter.status = status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: orders,
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
 * Get a single order for a user (verifies ownership).
 */
export async function getUserOrderById(userId: string, orderId: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new ValidationError('Invalid order ID');
  }

  const order = await Order.findOne({
    _id: new mongoose.Types.ObjectId(orderId),
    userId: new mongoose.Types.ObjectId(userId),
  }).populate('paymentId').lean();

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  return order;
}

/**
 * Cancel an order (customer). Only after payment is final (captured / COD authorized).
 * Allowed from confirmed or processing. Restores stock; marks captured payment refunded.
 */
export async function cancelOrder(userId: string, orderId: string, reason?: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new ValidationError('Invalid order ID');
  }

  const order = await Order.findOne({
    _id: new mongoose.Types.ObjectId(orderId),
    userId: new mongoose.Types.ObjectId(userId),
  }) as IOrderDocument | null;

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  const cancellableStatuses: string[] = ['confirmed', 'processing'];
  if (!cancellableStatuses.includes(order.status)) {
    throw new ValidationError(
      `Cannot cancel order with status "${order.status}". Only confirmed or processing orders can be cancelled.`,
    );
  }

  const payment = order.paymentId
    ? (await Payment.findById(order.paymentId) as IPaymentDocument | null)
    : null;
  assertPaymentFinalForCancel(payment);

  order.status = 'cancelled';

  // Add status history entry
  order.statusHistory.push({
    status: 'cancelled',
    changedAt: new Date(),
    changedBy: userId,
    note: reason ?? 'Cancelled by customer',
  });

  // reserved → release; committed → restore sold; none → legacy stock++; released → no-op
  await resolveOrderInventoryOnFailure(order);

  // If payment was captured, update payment status (DB record; gateway refund is manual)
  if (payment && payment.status === 'captured') {
    payment.status = 'refunded';
    await payment.save();
  }

  await order.save();
  return order.toObject();
}

/**
 * Request return for a delivered order.
 */
export async function requestReturn(userId: string, orderId: string, reason: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new ValidationError('Invalid order ID');
  }

  const order = await Order.findOne({
    _id: new mongoose.Types.ObjectId(orderId),
    userId: new mongoose.Types.ObjectId(userId),
  }) as IOrderDocument | null;

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.status !== 'delivered') {
    throw new ValidationError(
      `Cannot request return for order with status "${order.status}". Only delivered orders can be returned.`,
    );
  }

  order.status = 'return_requested';

  order.statusHistory.push({
    status: 'return_requested',
    changedAt: new Date(),
    changedBy: userId,
    note: reason,
  });

  await order.save();
  return order.toObject();
}

// ---------- Admin functions ----------

/**
 * List all orders with pagination, search, status filter, and sorting.
 */
export async function listAllOrders(
  page: number,
  limit: number,
  search?: string,
  status?: string,
  sortBy?: string,
) {
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.orderNumber = { $regex: search, $options: 'i' };
  }

  // Determine sort order
  let sort: Record<string, 1 | -1>;
  switch (sortBy) {
    case 'oldest':
      sort = { createdAt: 1 };
      break;
    case 'total_high':
      sort = { 'pricing.totalPaise': -1 };
      break;
    case 'total_low':
      sort = { 'pricing.totalPaise': 1 };
      break;
    case 'newest':
    default:
      sort = { createdAt: -1 };
      break;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: orders,
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
 * Get a single order by ID (admin — no ownership check).
 */
export async function getOrderById(orderId: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new ValidationError('Invalid order ID');
  }

  const order = await Order.findById(orderId).populate('paymentId').lean();
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  return order;
}

/**
 * Update order status with transition validation.
 * Handles shipped/delivered date tracking.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  changedBy: string,
  note?: string,
) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new ValidationError('Invalid order ID');
  }

  const order = await Order.findById(orderId) as IOrderDocument | null;
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  const oldStatus = order.status as OrderStatusType;

  // Validate transition
  if (!isValidOrderTransition(oldStatus, newStatus as OrderStatusType)) {
    throw new ValidationError(
      `Invalid status transition from "${oldStatus}" to "${newStatus}"`,
    );
  }

  // Cancel only after payment is final (same rule as customer cancel).
  if (newStatus === 'cancelled') {
    const payment = order.paymentId
      ? (await Payment.findById(order.paymentId) as IPaymentDocument | null)
      : null;
    assertPaymentFinalForCancel(payment);
  }

  order.status = newStatus;

  // Handle shipping timestamps
  if (newStatus === 'shipped') {
    if (!order.shipping) {
      order.shipping = {} as IOrderDocument['shipping'] & object;
    }
    order.shipping!.shippedAt = new Date();
  }

  if (newStatus === 'delivered') {
    if (!order.shipping) {
      order.shipping = {} as IOrderDocument['shipping'] & object;
    }
    order.shipping!.deliveredAt = new Date();
  }

  // reserved → release; committed → restore sold; none → legacy stock++; released → no-op
  // Payment status is left unchanged — admin refunds manually and updates payment separately.
  if (newStatus === 'cancelled') {
    await resolveOrderInventoryOnFailure(order);
  }

  // Add to status history
  order.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy,
    note,
  });

  await order.save();
  return order.toObject();
}

/**
 * Update shipping info for an order (carrier, tracking, etc.).
 */
export async function updateShippingInfo(
  orderId: string,
  shippingData: {
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: string | Date;
  },
) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new ValidationError('Invalid order ID');
  }

  const order = await Order.findById(orderId) as IOrderDocument | null;
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (!order.shipping) {
    order.shipping = {} as IOrderDocument['shipping'] & object;
  }

  if (shippingData.carrier !== undefined) {
    order.shipping!.carrier = shippingData.carrier;
  }
  if (shippingData.trackingNumber !== undefined) {
    order.shipping!.trackingNumber = shippingData.trackingNumber;
  }
  if (shippingData.trackingUrl !== undefined) {
    order.shipping!.trackingUrl = shippingData.trackingUrl;
  }
  if (shippingData.estimatedDelivery !== undefined) {
    order.shipping!.estimatedDelivery = new Date(shippingData.estimatedDelivery);
  }

  await order.save();
  return order.toObject();
}

/**
 * Initiate a refund — adds an entry to Payment.refunds[].
 * Updates payment status to 'refunded' or 'partially_refunded'.
 */
export async function initiateRefund(
  orderId: string,
  amountPaise: number,
  reason: string,
) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new ValidationError('Invalid order ID');
  }

  const order = await Order.findById(orderId).lean() as IOrderDocument | null;
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (!order.paymentId) {
    throw new ValidationError('No payment associated with this order');
  }

  const payment = await Payment.findById(order.paymentId) as IPaymentDocument | null;
  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  if (amountPaise < 1) {
    throw new ValidationError('Refund amount must be at least 1 paise');
  }

  // Calculate total already-refunded amount
  const totalRefunded = payment.refunds.reduce(
    (sum, r) => sum + r.amountPaise,
    0,
  );

  if (totalRefunded + amountPaise > payment.amountPaise) {
    throw new ValidationError(
      `Refund amount exceeds remaining refundable amount. Paid: ${payment.amountPaise}, Already refunded: ${totalRefunded}, Requested: ${amountPaise}`,
    );
  }

  // Add refund entry
  payment.refunds.push({
    amountPaise,
    reason,
    status: 'initiated',
    initiatedAt: new Date(),
  });

  // Update payment status
  const newTotalRefunded = totalRefunded + amountPaise;
  payment.status = newTotalRefunded >= payment.amountPaise
    ? 'refunded'
    : 'partially_refunded';

  await payment.save();
  return payment.toObject();
}
