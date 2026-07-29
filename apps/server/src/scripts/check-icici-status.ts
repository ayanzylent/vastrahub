/**
 * Direct ICICI Transaction Status Check CLI Script
 *
 * Query ICICI Command API directly for payment status using either a
 * `merchantTxnNo` (e.g. gatewayOrderId) or a MongoDB `orderId`.
 *
 * Usage from `apps/server`:
 *   npx tsx --env-file=.env src/scripts/check-icici-status.ts <MERCHANT_TXN_NO_OR_ORDER_ID>
 *
 * Options:
 *   --reconcile   Update order and payment status in the database based on ICICI response
 *
 * Examples:
 *   npx tsx --env-file=.env src/scripts/check-icici-status.ts ORD1722234567890
 *   npx tsx --env-file=.env src/scripts/check-icici-status.ts 65f1a2b3c4d5e6f7a8b9c0d1 --reconcile
 */

import mongoose from 'mongoose';
import Fastify from 'fastify';
import { queryIciciTransactionStatus } from '../lib/icici.js';
import { reconcileIciciPayment } from '../modules/payment/payment.service.js';
import { Order, Payment } from '../db/models/index.js';
import type { IOrderDocument, IPaymentDocument } from '../db/models/index.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import envPlugin, { getConfig } from '../config/env.js';

async function main() {
  const app = Fastify();
  await app.register(envPlugin);

  const args = process.argv.slice(2);
  const flags = args.filter((a) => a.startsWith('--'));
  const positionals = args.filter((a) => !a.startsWith('--'));

  const reconcile = flags.includes('--reconcile');
  const inputRef = positionals[0];

  if (!inputRef) {
    console.error(`
Usage:
  npm run check-icici-status -- <merchantTxnNo_or_orderId> [--reconcile]

Examples:
  npm run check-icici-status -- VH1722234567
  npm run check-icici-status -- 6789abcdef0123456789abcd --reconcile
`);
    process.exit(1);
  }

  let merchantTxnNo = inputRef;
  let orderId: string | null = null;
  let isMongoId = mongoose.Types.ObjectId.isValid(inputRef) && inputRef.length === 24;

  const config = getConfig();

  // If input is a 24-character Mongo ObjectId, fetch the order from DB to find merchantTxnNo
  if (isMongoId || reconcile) {
    console.log('Connecting to Database...');
    await connectDatabase(config);
    console.log('Database connected.');
  }

  if (isMongoId) {
    orderId = inputRef;
    console.log(`Looking up Order ID: ${orderId}...`);
    const order = (await Order.findById(orderId).lean()) as IOrderDocument | null;
    if (!order) {
      console.error(`❌ Order with ID "${orderId}" not found in database.`);
      if (mongoose.connection.readyState === 1) await disconnectDatabase();
      process.exit(1);
    }

    if (!order.paymentId) {
      console.error(`❌ Order "${orderId}" does not have a payment associated with it.`);
      if (mongoose.connection.readyState === 1) await disconnectDatabase();
      process.exit(1);
    }

    const payment = (await Payment.findById(order.paymentId).lean()) as IPaymentDocument | null;
    if (!payment || !payment.gatewayOrderId) {
      console.error(`❌ Payment record for order "${orderId}" missing gatewayOrderId (merchantTxnNo).`);
      if (mongoose.connection.readyState === 1) await disconnectDatabase();
      process.exit(1);
    }

    merchantTxnNo = payment.gatewayOrderId;
    console.log(`Found merchantTxnNo: "${merchantTxnNo}" for Order #${order.orderNumber}`);
  }

  console.log(`\n🔍 Querying ICICI Command API for transaction: "${merchantTxnNo}"...`);
  console.log(`Gateway Base URL: ${config.ICICI_BASE_URL}`);
  console.log(`Merchant ID: ${config.ICICI_MERCHANT_ID}`);
  console.log('--------------------------------------------------');

  try {
    const result = await queryIciciTransactionStatus(merchantTxnNo);

    console.log('\n✅ ICICI Status Response Received:');
    console.log(`• Outcome: ${result.outcome.toUpperCase()}`);
    console.log(`• Gateway Payment ID (txnID): ${result.gatewayPaymentId ?? 'N/A'}`);
    if (result.amountPaise !== undefined) {
      console.log(`• Amount: ₹${(result.amountPaise / 100).toFixed(2)} (${result.amountPaise} paise)`);
    }
    console.log('\nRaw Gateway Data:');
    console.dir(result.raw, { depth: null, colors: true });

    if (reconcile) {
      console.log('\n--------------------------------------------------');
      console.log('🔄 Reconciling payment and order status in database...');
      const recResult = await reconcileIciciPayment(merchantTxnNo, result, 'status', result.raw);
      console.log('✅ Reconciliation Complete:');
      console.log(`• Final Payment Status: ${recResult.paymentStatus}`);
      console.log(`• Final Outcome: ${recResult.outcome}`);
      if (recResult.orderNumber) {
        console.log(`• Order Number: ${recResult.orderNumber}`);
      }
    }
  } catch (err: any) {
    console.error('\n❌ Failed to query ICICI transaction status:');
    console.error(err?.message || err);
    if (err?.code) console.error(`Error Code: ${err.code}`);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await disconnectDatabase();
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
