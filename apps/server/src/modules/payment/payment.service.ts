/**
 * Payment service — business logic for payments and webhooks.
 */

import mongoose from 'mongoose';
import { Order, Payment } from '../../db/models/index.js';
import type { IOrderDocument, IPaymentDocument } from '../../db/models/index.js';
import { NotFoundError, ValidationError } from '../../lib/errors.js';
import { verifyPaymentSignature, verifyWebhookSignature } from '../../lib/razorpay.js';
import {
  verifyIciciHash,
  mapIciciOutcome,
  pickIciciPaymentId,
  queryIciciTransactionStatus,
  type IciciOutcome,
} from '../../lib/icici.js';
import {
  commitOrderInventory,
  resolveOrderInventoryOnFailure,
} from '../inventory/inventory.service.js';

/**
 * Atomically confirm order inventory + persist order + persist payment capture.
 * If inventory commit or either save fails, the transaction aborts and payment
 * is not left captured without a confirmed order.
 */
async function capturePaymentWithOrderConfirm(opts: {
  payment: IPaymentDocument;
  order: IOrderDocument | null;
  shouldConfirmOrder: boolean;
  confirmNote: string;
}): Promise<void> {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (opts.shouldConfirmOrder && opts.order) {
      opts.order.status = 'confirmed';
      opts.order.statusHistory.push({
        status: 'confirmed',
        changedAt: new Date(),
        changedBy: 'system',
        note: opts.confirmNote,
      });
      await commitOrderInventory(opts.order, session);
      await opts.order.save({ session });
    }

    await opts.payment.save({ session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
}

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

  payment.gatewayPaymentId = input.razorpayPaymentId;
  payment.gatewaySignature = input.razorpaySignature;
  payment.status = 'captured';
  payment.paidAt = new Date();

  const order = await Order.findById(payment.orderId) as IOrderDocument | null;
  const shouldConfirm =
    !!order && (order.status === 'pending' || order.status === 'failed');

  await capturePaymentWithOrderConfirm({
    payment,
    order,
    shouldConfirmOrder: shouldConfirm,
    confirmNote: 'Payment captured successfully',
  });

  return {
    success: true,
    orderId: order?._id,
    orderNumber: order?.orderNumber,
  };
}

// ─── ICICI: event-driven reconciliation ─────────────────────────────

export interface IciciReconcileResult {
  outcome: IciciOutcome;
  orderId?: mongoose.Types.ObjectId;
  orderNumber?: string;
  /** Payment status after reconciliation (created | captured | failed). */
  paymentStatus: string;
}

/**
 * Idempotently apply a payment outcome to the Payment + Order for a given
 * ICICI merchantTxnNo (stored as gatewayOrderId).
 *
 * This is the single source of truth for ICICI state transitions. Whichever
 * event arrives first — the browser return callback, the server-to-server
 * webhook, or a status-query poll — funnels through here; later events for an
 * already-settled payment are no-ops. A `pending` outcome never overwrites an
 * already-captured/failed payment.
 *
 * @param merchantTxnNo   The order reference (gatewayOrderId).
 * @param result          Normalised outcome + gateway payment id.
 * @param source          Where the event came from (for audit/history notes).
 * @param rawEvent        Raw payload to append to webhookEvents (optional).
 */
export async function reconcileIciciPayment(
  merchantTxnNo: string,
  result: { outcome: IciciOutcome; gatewayPaymentId?: string },
  source: 'callback' | 'webhook' | 'status',
  rawEvent?: Record<string, unknown>,
): Promise<IciciReconcileResult> {
  const payment = await Payment.findOne({
    gatewayOrderId: merchantTxnNo,
    gatewayName: 'icici',
  }) as IPaymentDocument | null;

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  // Always record the event for auditability.
  if (rawEvent) {
    // Standardise rawEvent to a plain object to prevent isPOJO errors in Mongoose
    // caused by objects with custom prototypes parsed by Fastify's body/query parser.
    const cleanEvent = JSON.parse(JSON.stringify(rawEvent));
    payment.webhookEvents.push({
      eventType: `icici.${source}.${result.outcome}`,
      payload: cleanEvent,
      receivedAt: new Date(),
    });
  }

  const order = await Order.findById(payment.orderId) as IOrderDocument | null;

  const isTimeoutFailedPayment =
    payment.status === 'failed' &&
    payment.failureReason === 'Stock reservation timed out';

  // Terminal states are immutable — except timeout-failed payments may be
  // revived when the gateway later reports paid (pay-after-expire).
  if (payment.status === 'captured') {
    if (payment.isModified()) await payment.save();
    return {
      outcome: 'paid',
      orderId: order?._id as mongoose.Types.ObjectId | undefined,
      orderNumber: order?.orderNumber,
      paymentStatus: payment.status,
    };
  }

  if (payment.status === 'failed' && !(isTimeoutFailedPayment && result.outcome === 'paid')) {
    if (payment.isModified()) await payment.save();
    return {
      outcome: 'failed',
      orderId: order?._id as mongoose.Types.ObjectId | undefined,
      orderNumber: order?.orderNumber,
      paymentStatus: payment.status,
    };
  }

  if (result.outcome === 'paid') {
    payment.status = 'captured';
    payment.paidAt = new Date();
    payment.set('failedAt', undefined);
    payment.set('failureReason', undefined);
    if (result.gatewayPaymentId) payment.gatewayPaymentId = result.gatewayPaymentId;

    // Confirm pending, or revive orders failed only by reservation expiry.
    const shouldConfirm = !!(
      order &&
      (order.status === 'pending' ||
        (order.status === 'failed' &&
          (order.inventoryHold === 'released' ||
            order.inventoryHold === 'committed' ||
            order.inventoryHold === 'reserved' ||
            isTimeoutFailedPayment)))
    );

    await capturePaymentWithOrderConfirm({
      payment,
      order,
      shouldConfirmOrder: shouldConfirm,
      confirmNote: isTimeoutFailedPayment
        ? `Payment captured via ICICI (${source}) after reservation timeout`
        : `Payment captured via ICICI (${source})`,
    });

    await Payment.updateOne(
      { _id: payment._id },
      { $unset: { failedAt: 1, failureReason: 1 } },
    );
  } else if (result.outcome === 'failed') {
    payment.status = 'failed';
    payment.failedAt = new Date();
    payment.failureReason = 'Payment failed at ICICI gateway';
    if (result.gatewayPaymentId) payment.gatewayPaymentId = result.gatewayPaymentId;

    if (order && order.status === 'pending') {
      order.status = 'failed';
      order.statusHistory.push({
        status: 'failed',
        changedAt: new Date(),
        changedBy: 'system',
        note: `Payment failed via ICICI (${source})`,
      });
      // Release reservation, or legacy stockQuantity++ when inventoryHold is none.
      await resolveOrderInventoryOnFailure(order);
      await order.save();
    }
    await payment.save();
  } else {
    // outcome === 'pending' → leave payment in 'created'; no order transition.
    // Still persist any webhookEvents appended above.
    await payment.save();
  }

  return {
    outcome: result.outcome === 'paid' && payment.status === 'captured'
      ? 'paid'
      : result.outcome,
    orderId: order?._id as mongoose.Types.ObjectId | undefined,
    orderNumber: order?.orderNumber,
    paymentStatus: payment.status,
  };
}

/**
 * Handle the browser return callback POSTed by ICICI to our returnURL.
 *
 * Verifies the secureHash, then reconciles. If the gateway reports the payment
 * as still "pending", we actively poll the Command API status endpoint once so
 * the buyer's redirect resolves to a definitive state where possible.
 *
 * @returns the merchantTxnNo (for building the frontend redirect) and outcome.
 */
export async function handleIciciCallback(fields: Record<string, unknown>) {
  if (!verifyIciciHash(fields)) {
    throw new ValidationError('Invalid ICICI callback signature', 'INVALID_SIGNATURE');
  }

  const merchantTxnNo = String(fields.merchantTxnNo ?? '');
  if (!merchantTxnNo) {
    throw new ValidationError('Missing merchantTxnNo in ICICI callback');
  }

  let mapped = mapIciciOutcome(fields);
  let reconciled = await reconcileIciciPayment(
    merchantTxnNo,
    mapped,
    'callback',
    fields,
  );

  // If still unresolved, ask the gateway directly before sending the user on.
  if (reconciled.outcome === 'pending') {
    try {
      mapped = await queryIciciTransactionStatus(merchantTxnNo);
      if (mapped.outcome !== 'pending') {
        reconciled = await reconcileIciciPayment(merchantTxnNo, mapped, 'status', mapped.raw);
      }
    } catch {
      // Leave as pending; webhook or a later status poll will settle it.
    }
  }

  return { merchantTxnNo, ...reconciled };
}

/**
 * Poll the ICICI Command API for a transaction's status and reconcile.
 * Verifies the order belongs to the requesting user. Used by the
 * success/processing page to resolve payments that are still in process.
 */
export async function getIciciPaymentStatusForUser(orderId: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new ValidationError('Invalid order ID');
  }

  const order = await Order.findOne({
    _id: new mongoose.Types.ObjectId(orderId),
    userId: new mongoose.Types.ObjectId(userId),
  }).lean() as unknown as IOrderDocument | null;

  if (!order || !order.paymentId) {
    throw new NotFoundError('Order not found');
  }

  const payment = await Payment.findById(order.paymentId) as IPaymentDocument | null;
  if (!payment || payment.gatewayName !== 'icici' || !payment.gatewayOrderId) {
    throw new NotFoundError('ICICI payment not found for this order');
  }

  // Short-circuit if already settled.
  if (payment.status === 'captured') {
    return { outcome: 'paid' as IciciOutcome, orderId: order._id, orderNumber: order.orderNumber, paymentStatus: payment.status };
  }
  if (payment.status === 'failed') {
    return { outcome: 'failed' as IciciOutcome, orderId: order._id, orderNumber: order.orderNumber, paymentStatus: payment.status };
  }

  const mapped = await queryIciciTransactionStatus(payment.gatewayOrderId);
  const reconciled = await reconcileIciciPayment(payment.gatewayOrderId, mapped, 'status', mapped.raw);
  return reconciled;
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

      const order = await Order.findById(payment.orderId) as IOrderDocument | null;
      const shouldConfirm =
        !!order && (order.status === 'pending' || order.status === 'failed');

      await capturePaymentWithOrderConfirm({
        payment,
        order,
        shouldConfirmOrder: shouldConfirm,
        confirmNote: 'Payment captured via webhook',
      });
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

        // Restore / release inventory based on hold state.
        await resolveOrderInventoryOnFailure(order);

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
 * Handle the ICICI server-to-server webhook (Payment Advice).
 *
 * The payload is URL-encoded by default, or JSON if configured during
 * onboarding; either way `@fastify/formbody` parses it into `fields`. We verify
 * the secureHash (carried in the body), then funnel the outcome through the
 * shared reconcile core (idempotent with the callback).
 *
 * @param fields  Parsed payload (form fields or JSON object), including `secureHash`.
 */
export async function handleIciciWebhook(fields: Record<string, unknown>) {
  if (!verifyIciciHash(fields)) {
    return { received: false };
  }

  const merchantTxnNo = String(fields.merchantTxnNo ?? '');
  if (!merchantTxnNo) {
    return { received: true }; // Nothing actionable; ack to stop retries.
  }

  const payment = await Payment.findOne({
    gatewayOrderId: merchantTxnNo,
    gatewayName: 'icici',
  }).lean();
  if (!payment) {
    return { received: true };
  }

  const mapped = mapIciciOutcome(fields);
  await reconcileIciciPayment(
    merchantTxnNo,
    { outcome: mapped.outcome, gatewayPaymentId: pickIciciPaymentId(fields) },
    'webhook',
    fields,
  );

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
