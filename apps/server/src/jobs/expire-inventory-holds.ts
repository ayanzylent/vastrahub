/**
 * Expire unpaid inventory reservations after STOCK_RESERVATION_TIMEOUT_MINS.
 *
 * Finds pending orders with inventoryHold=reserved and expired hold,
 * releases reservedQuantity, marks order failed, and fails unpaid payments.
 */

import type { FastifyBaseLogger } from 'fastify';
import { Order, Payment } from '../db/models/index.js';
import type { IOrderDocument, IPaymentDocument } from '../db/models/index.js';
import { releaseOrderInventory } from '../modules/inventory/inventory.service.js';

const TICK_MS = 60_000;

let intervalHandle: ReturnType<typeof setInterval> | null = null;
let tickRunning = false;

/**
 * @returns true when this order was expired in this call
 */
async function expireOneOrder(
  order: IOrderDocument,
  log: FastifyBaseLogger,
): Promise<boolean> {
  // Cheap guard: if payment already captured, do not release.
  if (order.paymentId) {
    const payment = await Payment.findById(order.paymentId)
      .select('status')
      .lean<{ status?: string } | null>();
    if (payment?.status === 'captured') {
      return false;
    }
  }

  // Drop SKU reservation first (claims reserved → released). If payment
  // already committed or hold was released, this is a no-op.
  const released = await releaseOrderInventory(order);
  if (!released) {
    return false;
  }

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: 'pending' },
    {
      $set: { status: 'failed' },
      $push: {
        statusHistory: {
          status: 'failed',
          changedAt: new Date(),
          changedBy: 'system',
          note: 'Reservation expired',
        },
      },
    },
    { new: true },
  );

  if (!updated) {
    return true; // inventory already released; status may have changed concurrently
  }

  if (updated.paymentId) {
    const payment = await Payment.findById(updated.paymentId) as IPaymentDocument | null;
    if (
      payment &&
      (payment.status === 'created' || payment.status === 'pending')
    ) {
      payment.status = 'failed';
      payment.failedAt = new Date();
      payment.failureReason = 'Stock reservation timed out';
      await payment.save();
    }
  }

  log.info(
    { orderId: String(updated._id), orderNumber: updated.orderNumber },
    'Expired unpaid inventory reservation',
  );
  return true;
}

export async function runExpireInventoryHolds(log: FastifyBaseLogger): Promise<number> {
  const now = new Date();
  const candidates = await Order.find({
    inventoryHold: 'reserved',
    status: 'pending',
    inventoryHoldExpiresAt: { $lte: now },
  }).limit(50) as IOrderDocument[];

  let expired = 0;
  for (const order of candidates) {
    try {
      if (await expireOneOrder(order, log)) {
        expired += 1;
      }
    } catch (err) {
      log.error(
        { err, orderId: String(order._id) },
        'Failed to expire inventory hold',
      );
    }
  }

  return expired;
}

/**
 * Start the periodic expiry job. Safe to call once at server boot.
 * Returns a stop function for graceful shutdown.
 */
export function startExpireInventoryHoldsJob(log: FastifyBaseLogger): () => void {
  if (intervalHandle) {
    return () => stopExpireInventoryHoldsJob();
  }

  const tick = async () => {
    if (tickRunning) return;
    tickRunning = true;
    try {
      const count = await runExpireInventoryHolds(log);
      if (count > 0) {
        log.info({ count }, 'Inventory hold expiry tick completed');
      }
    } catch (err) {
      log.error({ err }, 'Inventory hold expiry tick failed');
    } finally {
      tickRunning = false;
    }
  };

  void tick();
  intervalHandle = setInterval(() => {
    void tick();
  }, TICK_MS);

  log.info({ intervalMs: TICK_MS }, 'Started inventory hold expiry job');

  return () => stopExpireInventoryHoldsJob();
}

export function stopExpireInventoryHoldsJob(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
