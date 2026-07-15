/**
 * Release stock locked by the pre-reservation checkout model.
 *
 * Before Option B, ICICI create did `$inc stockQuantity: -qty` while payment
 * stayed unpaid. Abandoned checkouts never restored that stock.
 *
 * This script finds legacy unpaid ICICI orders (inventoryHold=none, pending,
 * payment created) older than a cutoff and restores stockQuantity, fails the
 * order/payment, and marks inventoryHold=released.
 *
 * Usage (from apps/server):
 *   npx tsx --env-file=.env src/scripts/release-legacy-unpaid-stock.ts
 *   npx tsx --env-file=.env src/scripts/release-legacy-unpaid-stock.ts --apply
 *   npx tsx --env-file=.env src/scripts/release-legacy-unpaid-stock.ts --apply --older-than-mins=15
 *
 * Dry-run is the default. Pass --apply to write changes.
 *
 * Cutover (3H maintenance):
 *   1. Close store / disable checkout
 *   2. Deploy Phases 1–4
 *   3. Dry-run this script → review
 *   4. --apply
 *   5. Smoke test ICICI create/pay/fail/COD
 *   6. Reopen store
 */

import mongoose from 'mongoose';
import { Order, Payment, Sku } from '../db/models/index.js';
import type { IOrderDocument, IPaymentDocument } from '../db/models/index.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { getConfig } from '../config/env.js';
import { APP_CONFIG } from '../constants/config.js';
import { recalculateProductAggregates } from '../modules/sku/sku.service.js';

function parseArgs(argv: string[]) {
  const apply = argv.includes('--apply');
  let olderThanMins: number = APP_CONFIG.STOCK_RESERVATION_TIMEOUT_MINS;
  for (const arg of argv) {
    if (arg.startsWith('--older-than-mins=')) {
      const n = Number(arg.split('=')[1]);
      if (Number.isFinite(n) && n >= 0) olderThanMins = n;
    }
  }
  return { apply, olderThanMins };
}

async function run() {
  const { apply, olderThanMins } = parseArgs(process.argv.slice(2));
  const cutoff = new Date(Date.now() - olderThanMins * 60_000);

  console.log('Connecting to database...');
  await connectDatabase(getConfig());
  console.log('Connected.');
  console.log(
    `Mode: ${apply ? 'APPLY (writes)' : 'DRY-RUN (no writes)'} | cutoff: older than ${olderThanMins} mins (${cutoff.toISOString()})`,
  );

  const candidates = await Order.find({
    status: 'pending',
    inventoryHold: 'none',
    createdAt: { $lte: cutoff },
  }) as IOrderDocument[];

  const rows: Array<{
    orderId: string;
    orderNumber: string;
    paymentId?: string;
    skus: Array<{ skuId: string; qty: number }>;
  }> = [];

  for (const order of candidates) {
    if (!order.paymentId) continue;
    const payment = await Payment.findById(order.paymentId) as IPaymentDocument | null;
    if (!payment) continue;
    if (payment.gatewayName !== 'icici') continue;
    if (payment.status !== 'created' && payment.status !== 'pending') continue;

    rows.push({
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      paymentId: String(payment._id),
      skus: order.items.map((i) => ({
        skuId: String(i.skuId),
        qty: i.quantity,
      })),
    });
  }

  console.log(`Found ${rows.length} legacy unpaid ICICI order(s) to release.`);
  for (const row of rows) {
    console.log(
      `  - ${row.orderNumber} (${row.orderId}) skus=${row.skus.map((s) => `${s.skuId}:${s.qty}`).join(',')}`,
    );
  }

  if (!apply) {
    console.log('Dry-run complete. Re-run with --apply to write changes.');
    await disconnectDatabase();
    return;
  }

  let applied = 0;
  for (const row of rows) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const claimed = await Order.findOneAndUpdate(
        {
          _id: row.orderId,
          status: 'pending',
          inventoryHold: 'none',
        },
        {
          $set: {
            status: 'failed',
            inventoryHold: 'released',
            inventoryHoldUpdatedAt: new Date(),
          },
          $push: {
            statusHistory: {
              status: 'failed',
              changedAt: new Date(),
              changedBy: 'system',
              note: 'Legacy unpaid stock released during reservation cutover',
            },
          },
        },
        { new: true, session },
      );

      if (!claimed) {
        await session.abortTransaction();
        console.log(`  skip ${row.orderNumber}: already processed`);
        continue;
      }

      for (const item of claimed.items) {
        const updated = await Sku.findOneAndUpdate(
          { _id: item.skuId },
          { $inc: { stockQuantity: item.quantity } },
          { new: true, session },
        );
        if (updated) {
          await recalculateProductAggregates(updated.productId, session);
        }
      }

      if (row.paymentId) {
        await Payment.updateOne(
          {
            _id: row.paymentId,
            status: { $in: ['created', 'pending'] },
          },
          {
            $set: {
              status: 'failed',
              failedAt: new Date(),
              failureReason: 'Legacy unpaid stock released during reservation cutover',
            },
          },
          { session },
        );
      }

      await session.commitTransaction();
      applied += 1;
      console.log(`  applied ${row.orderNumber}`);
    } catch (err) {
      await session.abortTransaction();
      console.error(`  failed ${row.orderNumber}:`, err);
    } finally {
      await session.endSession();
    }
  }

  console.log(`Done. Applied ${applied}/${rows.length}.`);
  await disconnectDatabase();
}

run().catch(async (err) => {
  console.error(err);
  try {
    await disconnectDatabase();
  } catch {
    // ignore
  }
  process.exit(1);
});
