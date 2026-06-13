/**
 * Payment model.
 * Tracks payment lifecycle including gateway interactions, refunds, and webhook events.
 */

import mongoose, { Schema, type Document, type Types } from 'mongoose';

// ---------- Interfaces ----------

export interface IRefund {
  amountPaise: number;
  reason: string;
  status: string;
  gatewayRefundId?: string;
  initiatedAt: Date;
  completedAt?: Date;
}

export interface IWebhookEvent {
  eventType: string;
  payload: Record<string, unknown>;
  receivedAt: Date;
}

export interface IPaymentDocument extends Document {
  orderId: Types.ObjectId;
  gatewayName: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  amountPaise: number;
  currency: string;
  method?: string;
  methodDetails?: Record<string, unknown>;
  status: string;
  refunds: IRefund[];
  paidAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  webhookEvents: IWebhookEvent[];
  createdAt: Date;
  updatedAt: Date;
}

// ---------- Sub-schemas ----------

const refundSchema = new Schema<IRefund>(
  {
    amountPaise: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['initiated', 'processing', 'completed', 'failed'],
      default: 'initiated',
    },
    gatewayRefundId: { type: String },
    initiatedAt: { type: Date, required: true, default: () => new Date() },
    completedAt: { type: Date },
  },
  { _id: true },
);

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    eventType: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    receivedAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false },
);

// ---------- Main schema ----------

const paymentSchema = new Schema<IPaymentDocument>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
      index: true,
    },
    gatewayName: {
      type: String,
      required: [true, 'Payment gateway name is required'],
      enum: ['razorpay', 'cod', 'icici'],
    },
    gatewayOrderId: { type: String },
    gatewayPaymentId: { type: String },
    gatewaySignature: { type: String },
    amountPaise: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Payment amount must be at least 1 paise'],
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    method: {
      type: String,
      enum: ['upi', 'credit_card', 'debit_card', 'net_banking', 'wallet', 'cod'],
    },
    methodDetails: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      required: true,
      default: 'created',
      enum: [
        'created', 'authorized', 'captured', 'failed',
        'refunded', 'partially_refunded',
      ],
    },
    refunds: {
      type: [refundSchema],
      default: [],
    },
    paidAt: { type: Date },
    failedAt: { type: Date },
    failureReason: { type: String },
    webhookEvents: {
      type: [webhookEventSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'payments',
  },
);

// ---------- Indexes ----------

paymentSchema.index({ gatewayOrderId: 1, gatewayName: 1 }, { unique: true, sparse: true });
paymentSchema.index({ gatewayPaymentId: 1, gatewayName: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// ---------- Export ----------

export const Payment = mongoose.models.Payment
  || mongoose.model<IPaymentDocument>('Payment', paymentSchema);
