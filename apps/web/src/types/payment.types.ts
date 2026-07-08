import type { TimestampFields } from './common.types';

/**
 * Payment status values.
 */
export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUND_INITIATED = 'refund_initiated',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

/**
 * Payment methods.
 */
export enum PaymentMethod {
  UPI = 'upi',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  NET_BANKING = 'net_banking',
  WALLET = 'wallet',
  COD = 'cod',
}

/**
 * Refund record.
 */
export interface IRefund {
  _id: string;
  amountPaise: number;
  reason: string;
  status: string;
  initiatedAt: Date;
  completedAt?: Date;
  gatewayRefundId?: string;
}

/**
 * Payment document.
 */
export interface IPayment extends TimestampFields {
  _id: string;
  orderId: string;
  userId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amountPaise: number;
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  gatewaySignature?: string;
  refunds: IRefund[];
  paidAt?: Date;
  failureReason?: string;
}
