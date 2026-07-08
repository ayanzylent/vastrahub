import type { TimestampFields } from './common.types';

/**
 * All possible order statuses.
 */
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURN_REQUESTED = 'return_requested',
  RETURN_APPROVED = 'return_approved',
  RETURN_PICKED_UP = 'return_picked_up',
  RETURNED = 'returned',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

/**
 * Shipping address snapshot on an order.
 */
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

/**
 * Coupon snapshot as applied at time of order.
 */
export interface ICouponSnapshot {
  code: string;
  discountType: string;
  percentageValue?: number;
  fixedAmountPaise?: number;
  discountAmountPaise: number;
}

/**
 * A single item within an order.
 */
export interface IOrderItem {
  productId: string;
  skuId: string;
  productName: string;
  variantLabel: string;
  imageUrl?: string;
  quantity: number;
  pricePaise: number;
  mrpPaise: number;
  totalPaise: number;
  gstPercentage: number;
  gstAmountPaise: number;
}

/**
 * Order pricing breakdown.
 */
export interface IOrderPricing {
  subtotalPaise: number;
  shippingPaise: number;
  taxPaise: number;
  discountPaise: number;
  totalPaise: number;
}

/**
 * Order document.
 */
export interface IOrder extends TimestampFields {
  _id: string;
  orderNumber: string;
  userId: string;
  items: IOrderItem[];
  pricing: IOrderPricing;
  shippingAddress: IShippingAddress;
  couponSnapshot?: ICouponSnapshot;
  status: OrderStatus;
  paymentId?: string;
  notes?: string;
  cancelReason?: string;
  returnReason?: string;
  deliveredAt?: Date;
  cancelledAt?: Date;
}
