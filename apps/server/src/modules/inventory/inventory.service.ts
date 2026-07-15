/**
 * Inventory reservation helpers (Shopify-style).
 *
 * available = stockQuantity - reservedQuantity
 * - reserve: hold units for unpaid prepaid checkout
 * - commit: convert reservation → sold (or sell directly for COD)
 * - release: drop unpaid reservation
 * - restoreSold: return committed units (e.g. cancel after pay/COD)
 */

import mongoose, { type ClientSession, type Types } from 'mongoose';
import { Order, Sku } from '../../db/models/index.js';
import type { IOrderDocument, InventoryHold } from '../../db/models/index.js';
import { APP_CONFIG } from '../../constants/config.js';
import { ValidationError } from '../../lib/errors.js';

type SkuId = Types.ObjectId | string;

function reservationExpiryDate(from = new Date()): Date {
  return new Date(from.getTime() + APP_CONFIG.STOCK_RESERVATION_TIMEOUT_MINS * 60_000);
}

function syncHoldFields(
  order: IOrderDocument,
  hold: InventoryHold,
  expiresAt?: Date | null,
): void {
  order.inventoryHold = hold;
  order.inventoryHoldUpdatedAt = new Date();
  if (expiresAt === null) {
    order.inventoryHoldExpiresAt = undefined;
  } else if (expiresAt !== undefined) {
    order.inventoryHoldExpiresAt = expiresAt;
  }
}

/** Atomically increase reservedQuantity when available stock covers qty. */
export async function reserveSkuStock(
  skuId: SkuId,
  quantity: number,
  session?: ClientSession | null,
): Promise<void> {
  const updated = await Sku.findOneAndUpdate(
    {
      _id: skuId,
      $expr: {
        $gte: [{ $subtract: ['$stockQuantity', '$reservedQuantity'] }, quantity],
      },
    },
    { $inc: { reservedQuantity: quantity } },
    { new: true, session: session ?? undefined },
  );

  if (!updated) {
    throw new ValidationError(`Insufficient available stock to reserve for SKU ${String(skuId)}`);
  }
}

/**
 * Convert a reservation into sold stock:
 * reservedQuantity -= qty, stockQuantity -= qty.
 */
export async function commitSkuStock(
  skuId: SkuId,
  quantity: number,
  session?: ClientSession | null,
): Promise<void> {
  const updated = await Sku.findOneAndUpdate(
    { _id: skuId, reservedQuantity: { $gte: quantity } },
    { $inc: { reservedQuantity: -quantity, stockQuantity: -quantity } },
    { new: true, session: session ?? undefined },
  );

  if (!updated) {
    throw new ValidationError(
      `Cannot commit stock for SKU ${String(skuId)}: reservation missing or insufficient`,
    );
  }
}

/**
 * Sell immediately without a prior reservation (COD).
 * Decrements stockQuantity only, gated on available stock.
 */
export async function commitSkuStockDirect(
  skuId: SkuId,
  quantity: number,
  session?: ClientSession | null,
): Promise<void> {
  const updated = await Sku.findOneAndUpdate(
    {
      _id: skuId,
      $expr: {
        $gte: [{ $subtract: ['$stockQuantity', '$reservedQuantity'] }, quantity],
      },
    },
    { $inc: { stockQuantity: -quantity } },
    { new: true, session: session ?? undefined },
  );

  if (!updated) {
    throw new ValidationError(`Insufficient available stock for SKU ${String(skuId)}`);
  }
}

/**
 * Unconditional stockQuantity decrement used when payment won after a
 * reservation was released and available stock is already gone (rare oversell).
 */
async function forceDecrementSkuStock(
  skuId: SkuId,
  quantity: number,
  session?: ClientSession | null,
): Promise<void> {
  await Sku.updateOne(
    { _id: skuId },
    { $inc: { stockQuantity: -quantity } },
    { session: session ?? undefined },
  );
}

/**
 * After expiry released a hold, payment still won: take stock from available
 * (or force-decrement if another buyer took it), then claim released → committed.
 */
async function recommitReleasedOrderInventory(
  order: IOrderDocument,
  session?: ClientSession | null,
): Promise<boolean> {
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, inventoryHold: 'released' },
    {
      $set: {
        inventoryHold: 'committed',
        inventoryHoldUpdatedAt: new Date(),
      },
      $unset: { inventoryHoldExpiresAt: 1 },
    },
    { new: true, session: session ?? undefined },
  );

  if (!claimed) {
    const current = await Order.findById(order._id).session(session ?? null);
    if (current?.inventoryHold === 'committed') {
      syncHoldFields(order, 'committed', null);
      return false;
    }
    throw new ValidationError(
      `Cannot recommit released inventory: order hold is "${current?.inventoryHold ?? 'missing'}"`,
    );
  }

  for (const item of order.items) {
    try {
      await commitSkuStockDirect(item.skuId, item.quantity, session);
    } catch {
      // Payment already won; prefer oversell over dropping a paid order.
      console.warn(
        JSON.stringify({
          msg: 'Pay-after-expire: forcing stock decrement (available insufficient)',
          orderId: String(order._id),
          orderNumber: order.orderNumber,
          skuId: String(item.skuId),
          quantity: item.quantity,
        }),
      );
      await forceDecrementSkuStock(item.skuId, item.quantity, session);
    }
  }

  syncHoldFields(order, 'committed', null);
  return true;
}

/** Legacy none-hold: stock was already decremented at create; only mark committed. */
async function markLegacyHoldCommitted(
  order: IOrderDocument,
  session?: ClientSession | null,
): Promise<boolean> {
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, inventoryHold: 'none' },
    {
      $set: {
        inventoryHold: 'committed',
        inventoryHoldUpdatedAt: new Date(),
      },
      $unset: { inventoryHoldExpiresAt: 1 },
    },
    { new: true, session: session ?? undefined },
  );

  if (!claimed) {
    const current = await Order.findById(order._id).session(session ?? null);
    if (current?.inventoryHold === 'committed') {
      syncHoldFields(order, 'committed', null);
      return false;
    }
    throw new ValidationError(
      `Cannot mark legacy hold committed: order hold is "${current?.inventoryHold ?? 'missing'}"`,
    );
  }

  syncHoldFields(order, 'committed', null);
  return true;
}

/** Drop an unpaid reservation: reservedQuantity -= qty. */
export async function releaseSkuStock(
  skuId: SkuId,
  quantity: number,
  session?: ClientSession | null,
): Promise<void> {
  const updated = await Sku.findOneAndUpdate(
    { _id: skuId, reservedQuantity: { $gte: quantity } },
    { $inc: { reservedQuantity: -quantity } },
    { new: true, session: session ?? undefined },
  );

  if (!updated) {
    throw new ValidationError(
      `Cannot release reservation for SKU ${String(skuId)}: reserved quantity insufficient`,
    );
  }
}

/** Return sold units to on-hand stock (cancel after commit). */
export async function restoreSoldSkuStock(
  skuId: SkuId,
  quantity: number,
  session?: ClientSession | null,
): Promise<void> {
  await Sku.updateOne(
    { _id: skuId },
    { $inc: { stockQuantity: quantity } },
    { session: session ?? undefined },
  );
}

/**
 * Legacy path: pre-reservation orders decremented stockQuantity at create.
 * Restoring means adding qty back to stockQuantity.
 */
export async function restoreLegacyDecrementedStock(
  order: IOrderDocument,
  session?: ClientSession | null,
): Promise<void> {
  for (const item of order.items) {
    await Sku.updateOne(
      { _id: item.skuId },
      { $inc: { stockQuantity: item.quantity } },
      { session: session ?? undefined },
    );
  }
}

/**
 * Claim none → reserved and reserve each line item.
 * Works for unsaved in-memory orders (checkout transaction) and persisted orders.
 * Idempotent if already reserved.
 */
export async function reserveOrderInventory(
  order: IOrderDocument,
  session?: ClientSession | null,
): Promise<IOrderDocument> {
  if (order.inventoryHold === 'reserved') {
    return order;
  }
  if (order.inventoryHold && order.inventoryHold !== 'none') {
    throw new ValidationError(
      `Cannot reserve inventory: order hold is "${order.inventoryHold}"`,
    );
  }

  const expiresAt = reservationExpiryDate();
  const persisted = await Order.findById(order._id).session(session ?? null);

  if (persisted) {
    const claimed = await Order.findOneAndUpdate(
      { _id: order._id, inventoryHold: 'none' },
      {
        $set: {
          inventoryHold: 'reserved',
          inventoryHoldExpiresAt: expiresAt,
          inventoryHoldUpdatedAt: new Date(),
        },
      },
      { new: true, session: session ?? undefined },
    );

    if (!claimed) {
      const current = await Order.findById(order._id).session(session ?? null);
      if (current?.inventoryHold === 'reserved') {
        syncHoldFields(order, 'reserved', current.inventoryHoldExpiresAt);
        return current;
      }
      throw new ValidationError(
        `Cannot reserve inventory: order hold is "${current?.inventoryHold ?? 'missing'}"`,
      );
    }
  }

  for (const item of order.items) {
    await reserveSkuStock(item.skuId, item.quantity, session);
  }

  syncHoldFields(order, 'reserved', expiresAt);
  return order;
}

/**
 * Claim reserved → committed and convert reservations to sold stock.
 * Idempotent if already committed.
 * If hold was released by the expiry job (pay-after-expire), re-sell from
 * available stock (or force-decrement) and mark committed — does not throw
 * on `released` / `none`.
 */
export async function commitOrderInventory(
  order: IOrderDocument,
  session?: ClientSession | null,
): Promise<boolean> {
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, inventoryHold: 'reserved' },
    {
      $set: {
        inventoryHold: 'committed',
        inventoryHoldUpdatedAt: new Date(),
      },
      $unset: { inventoryHoldExpiresAt: 1 },
    },
    { new: true, session: session ?? undefined },
  );

  if (!claimed) {
    const current = await Order.findById(order._id).session(session ?? null);
    const hold = current?.inventoryHold ?? order.inventoryHold;

    if (hold === 'committed') {
      syncHoldFields(order, 'committed', null);
      return false;
    }

    if (hold === 'released') {
      syncHoldFields(order, 'released', null);
      return recommitReleasedOrderInventory(order, session);
    }

    if (hold === 'none') {
      syncHoldFields(order, 'none', null);
      return markLegacyHoldCommitted(order, session);
    }

    throw new ValidationError(
      `Cannot commit inventory: order hold is "${hold ?? 'missing'}"`,
    );
  }

  for (const item of order.items) {
    await commitSkuStock(item.skuId, item.quantity, session);
  }

  syncHoldFields(order, 'committed', null);
  return true;
}

/**
 * COD / immediate sale: set committed and decrement stockQuantity.
 * Works for unsaved checkout orders and persisted orders.
 */
export async function commitOrderInventoryDirect(
  order: IOrderDocument,
  session?: ClientSession | null,
): Promise<IOrderDocument> {
  if (order.inventoryHold === 'committed') {
    return order;
  }
  if (order.inventoryHold && order.inventoryHold !== 'none') {
    throw new ValidationError(
      `Cannot commit inventory directly: order hold is "${order.inventoryHold}"`,
    );
  }

  const persisted = await Order.findById(order._id).session(session ?? null);

  if (persisted) {
    const claimed = await Order.findOneAndUpdate(
      { _id: order._id, inventoryHold: 'none' },
      {
        $set: {
          inventoryHold: 'committed',
          inventoryHoldUpdatedAt: new Date(),
        },
        $unset: { inventoryHoldExpiresAt: 1 },
      },
      { new: true, session: session ?? undefined },
    );

    if (!claimed) {
      const current = await Order.findById(order._id).session(session ?? null);
      if (current?.inventoryHold === 'committed') {
        syncHoldFields(order, 'committed', null);
        return current;
      }
      throw new ValidationError(
        `Cannot commit inventory directly: order hold is "${current?.inventoryHold ?? 'missing'}"`,
      );
    }
  }

  for (const item of order.items) {
    await commitSkuStockDirect(item.skuId, item.quantity, session);
  }

  syncHoldFields(order, 'committed', null);
  return order;
}

/**
 * Claim reserved → released and drop SKU reservations.
 * No-op (returns false) if already released or committed.
 */
export async function releaseOrderInventory(
  order: IOrderDocument,
  session?: ClientSession | null,
): Promise<boolean> {
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, inventoryHold: 'reserved' },
    {
      $set: {
        inventoryHold: 'released',
        inventoryHoldUpdatedAt: new Date(),
      },
      $unset: { inventoryHoldExpiresAt: 1 },
    },
    { new: true, session: session ?? undefined },
  );

  if (!claimed) {
    const current = await Order.findById(order._id).session(session ?? null);
    if (
      current?.inventoryHold === 'released' ||
      current?.inventoryHold === 'committed'
    ) {
      syncHoldFields(order, current.inventoryHold, null);
      return false;
    }
    // none / missing — caller may use legacy restore
    return false;
  }

  for (const item of order.items) {
    await releaseSkuStock(item.skuId, item.quantity, session);
  }

  syncHoldFields(order, 'released', null);
  return true;
}

/**
 * After a committed sale is cancelled: restore sold stock and mark hold released.
 * Idempotent if already released.
 */
export async function releaseCommittedOrderInventory(
  order: IOrderDocument,
  session?: ClientSession | null,
): Promise<boolean> {
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, inventoryHold: 'committed' },
    {
      $set: {
        inventoryHold: 'released',
        inventoryHoldUpdatedAt: new Date(),
      },
      $unset: { inventoryHoldExpiresAt: 1 },
    },
    { new: true, session: session ?? undefined },
  );

  if (!claimed) {
    const current = await Order.findById(order._id).session(session ?? null);
    if (current?.inventoryHold === 'released') {
      syncHoldFields(order, 'released', null);
      return false;
    }
    return false;
  }

  for (const item of order.items) {
    await restoreSoldSkuStock(item.skuId, item.quantity, session);
  }

  syncHoldFields(order, 'released', null);
  return true;
}

/**
 * Resolve stock return for fail/cancel based on hold state.
 * - reserved → release reservation
 * - committed → restore sold stock
 * - none → legacy stockQuantity++ (pre-cutover unpaid orders)
 * - released → no-op
 */
export async function resolveOrderInventoryOnFailure(
  order: IOrderDocument,
  session?: ClientSession | null,
): Promise<void> {
  const hold = order.inventoryHold ?? 'none';

  if (hold === 'reserved') {
    await releaseOrderInventory(order, session);
    return;
  }

  if (hold === 'committed') {
    await releaseCommittedOrderInventory(order, session);
    return;
  }

  if (hold === 'released') {
    return;
  }

  // Legacy: inventoryHold === 'none' — stock was hard-decremented at create.
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, inventoryHold: 'none' },
    {
      $set: {
        inventoryHold: 'released',
        inventoryHoldUpdatedAt: new Date(),
      },
      $unset: { inventoryHoldExpiresAt: 1 },
    },
    { new: true, session: session ?? undefined },
  );

  if (!claimed) {
    return; // already migrated / concurrent release
  }

  await restoreLegacyDecrementedStock(order, session);
  syncHoldFields(order, 'released', null);
}

/** Convenience: ObjectId guard used by jobs/scripts. */
export function isValidObjectId(id: unknown): id is string {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
}
