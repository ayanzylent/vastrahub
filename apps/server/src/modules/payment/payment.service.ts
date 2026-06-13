/**
 * Payment service — business logic for payments and webhooks.
 */

import mongoose from 'mongoose';
import { Order, Payment, Sku } from '../../db/models/index.js';
import type { IOrderDocument, IPaymentDocument } from '../../db/models/index.js';
import { NotFoundError, ValidationError } from '../../lib/errors.js';
import { verifyPaymentSignature, verifyWebhookSignature } from '../../lib/razorpay.js';
import { verifyIciciPaymentSignature, verifyIciciWebhookSignature } from '../../lib/icici.js';

interface VerifyRazorpayInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

/**
 * Verify Razorpay payment signature and update order/payment status.
 */
export async function verifyRazorpayPayment(input: VerifyRazorpayInput) {
  const isValid = verifyPaymentSignature(input);
  if (!isValid) {
    throw new ValidationError('Invalid payment signature', 'INVALID_SIGNATURE');
  }

  const payment = await Payment.findOne({
    gatewayOrderId: input.razorpayOrderId,
    gatewayName: 'razorpay',
  }) as IPaymentDocument | null;

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  if (payment.status === 'captured') {
    // Already processed, idempotent response
    const order = await Order.findById(payment.orderId).lean() as unknown as IOrderDocument;
    return { success: true, orderId: order._id, orderNumber: order.orderNumber };
  }

  // Update payment
  payment.gatewayPaymentId = input.razorpayPaymentId;
  payment.gatewaySignature = input.razorpaySignature;
  payment.status = 'captured';
  payment.paidAt = new Date();
  await payment.save();

  // Update order
  const order = await Order.findById(payment.orderId) as IOrderDocument | null;
  if (order) {
    order.status = 'confirmed';
    order.statusHistory.push({
      status: 'confirmed',
      changedAt: new Date(),
      changedBy: 'system',
      note: 'Payment captured successfully',
    });
    await order.save();
  }

  return {
    success: true,
    orderId: order?._id,
    orderNumber: order?.orderNumber,
  };
}

interface VerifyIciciInput {
  iciciOrderId: string;
  iciciPaymentId: string;
  iciciSignature: string;
}

/**
 * Verify ICICI payment signature and update order/payment status.
 */
export async function verifyIciciPayment(input: VerifyIciciInput) {
  const isValid = verifyIciciPaymentSignature(input);
  if (!isValid) {
    throw new ValidationError('Invalid payment signature', 'INVALID_SIGNATURE');
  }

  const payment = await Payment.findOne({
    gatewayOrderId: input.iciciOrderId,
    gatewayName: 'icici',
  }) as IPaymentDocument | null;

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  if (payment.status === 'captured') {
    // Already processed, idempotent response
    const order = await Order.findById(payment.orderId).lean() as unknown as IOrderDocument;
    return { success: true, orderId: order._id, orderNumber: order.orderNumber };
  }

  // Update payment
  payment.gatewayPaymentId = input.iciciPaymentId;
  payment.gatewaySignature = input.iciciSignature;
  payment.status = 'captured';
  payment.paidAt = new Date();
  await payment.save();

  // Update order
  const order = await Order.findById(payment.orderId) as IOrderDocument | null;
  if (order) {
    order.status = 'confirmed';
    order.statusHistory.push({
      status: 'confirmed',
      changedAt: new Date(),
      changedBy: 'system',
      note: 'Payment captured successfully via ICICI',
    });
    await order.save();
  }

  return {
    success: true,
    orderId: order?._id,
    orderNumber: order?.orderNumber,
  };
}

/**
 * Handle Razorpay webhooks.
 */
export async function handleWebhook(rawBody: string, signature: string) {
  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    return { received: false };
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    return { received: false };
  }

  const eventType = event.event;
  const paymentEntity = event.payload?.payment?.entity;
  const orderId = paymentEntity?.order_id; // Razorpay order id

  if (!orderId) {
    return { received: true }; // Ignore events without order_id
  }

  const payment = await Payment.findOne({ gatewayOrderId: orderId }) as IPaymentDocument | null;
  if (!payment) {
    return { received: true };
  }

  // Log event
  payment.webhookEvents.push({
    eventType,
    payload: event,
    receivedAt: new Date(),
  });

  if (eventType === 'payment.captured') {
    if (payment.status !== 'captured') {
      payment.status = 'captured';
      payment.gatewayPaymentId = paymentEntity.id;
      payment.paidAt = new Date();
      await payment.save();

      const order = await Order.findById(payment.orderId) as IOrderDocument | null;
      if (order && order.status === 'pending') {
        order.status = 'confirmed';
        order.statusHistory.push({
          status: 'confirmed',
          changedAt: new Date(),
          changedBy: 'system',
          note: 'Payment captured via webhook',
        });
        await order.save();
      }
    }
  } else if (eventType === 'payment.failed') {
    if (payment.status !== 'failed') {
      payment.status = 'failed';
      payment.failedAt = new Date();
      payment.failureReason = paymentEntity.error_description || 'Payment failed';
      await payment.save();

      const order = await Order.findById(payment.orderId) as IOrderDocument | null;
      if (order && order.status === 'pending') {
        order.status = 'failed';
        order.statusHistory.push({
          status: 'failed',
          changedAt: new Date(),
          changedBy: 'system',
          note: `Payment failed: ${payment.failureReason}`,
        });

        // Restore stock
        for (const item of order.items) {
          await Sku.updateOne(
            { _id: item.skuId },
            { $inc: { stockQuantity: item.quantity } }
          );
        }

        await order.save();
      }
    }
  }

  // We could handle refunds here too if needed, but keeping it focused on payment completion/failure

  if (payment.isModified()) {
    await payment.save();
  }

  return { received: true };
}

/**
 * Handle ICICI webhooks.
 */
export async function handleIciciWebhook(rawBody: string, signature: string) {
  const isValid = verifyIciciWebhookSignature(rawBody, signature);
  if (!isValid) {
    return { received: false };
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    return { received: false };
  }

  const orderId = event.orderId;
  const paymentId = event.paymentId;
  const status = event.status; // 'captured' or 'failed'

  if (!orderId) {
    return { received: true };
  }

  const payment = await Payment.findOne({ gatewayOrderId: orderId, gatewayName: 'icici' }) as IPaymentDocument | null;
  if (!payment) {
    return { received: true };
  }

  // Log event
  payment.webhookEvents.push({
    eventType: `payment.${status}`,
    payload: event,
    receivedAt: new Date(),
  });

  if (status === 'captured') {
    if (payment.status !== 'captured') {
      payment.status = 'captured';
      payment.gatewayPaymentId = paymentId;
      payment.paidAt = new Date();
      await payment.save();

      const order = await Order.findById(payment.orderId) as IOrderDocument | null;
      if (order && order.status === 'pending') {
        order.status = 'confirmed';
        order.statusHistory.push({
          status: 'confirmed',
          changedAt: new Date(),
          changedBy: 'system',
          note: 'Payment captured via ICICI webhook',
        });
        await order.save();
      }
    }
  } else if (status === 'failed') {
    if (payment.status !== 'failed') {
      payment.status = 'failed';
      payment.failedAt = new Date();
      payment.failureReason = event.failureReason || 'Payment failed';
      await payment.save();

      const order = await Order.findById(payment.orderId) as IOrderDocument | null;
      if (order && order.status === 'pending') {
        order.status = 'failed';
        order.statusHistory.push({
          status: 'failed',
          changedAt: new Date(),
          changedBy: 'system',
          note: `Payment failed via ICICI: ${payment.failureReason}`,
        });

        // Restore stock
        for (const item of order.items) {
          await Sku.updateOne(
            { _id: item.skuId },
            { $inc: { stockQuantity: item.quantity } }
          );
        }

        await order.save();
      }
    }
  }

  if (payment.isModified()) {
    await payment.save();
  }

  return { received: true };
}

/**
 * Get payment status for a specific order.
 * Verifies order belongs to user.
 */
export async function getPaymentByOrderId(orderId: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new ValidationError('Invalid order ID');
  }

  const order = await Order.findOne({
    _id: new mongoose.Types.ObjectId(orderId),
    userId: new mongoose.Types.ObjectId(userId),
  }).lean() as unknown as IOrderDocument | null;

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (!order.paymentId) {
    throw new NotFoundError('No payment found for this order');
  }

  const payment = await Payment.findById(order.paymentId).lean();
  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  return payment;
}
