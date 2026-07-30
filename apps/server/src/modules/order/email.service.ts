/**
 * Order email dispatch service.
 *
 * Looks up the customer, builds the email, and sends it via ZeptoMail.
 * Every public function is fire-and-forget: errors are logged, never thrown.
 */

import mongoose from 'mongoose';
import type { IOrderDocument } from '../../db/models/index.js';
import { sendMail } from '../../lib/zeptomail.js';
import { buildOrderConfirmationEmail } from '../../lib/email-templates/order-confirmation.js';
import { getConfig } from '../../config/env.js';

// ─── Helpers ─────────────────────────────────────────────────────────

/** Fetch customer name + email from Better-Auth's `user` collection. */
async function getCustomerInfo(userId: mongoose.Types.ObjectId | string): Promise<{
  name: string;
  email: string;
} | null> {
  try {
    const user = await mongoose.connection
      .collection('user')
      .findOne(
        { _id: new mongoose.Types.ObjectId(String(userId)) },
        { projection: { name: 1, email: 1 } },
      );
    if (!user || !user.email) return null;
    return { name: (user.name as string) ?? 'Customer', email: user.email as string };
  } catch {
    return null;
  }
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Send an order confirmation email to the customer.
 *
 * **Fire-and-forget** — never throws. Safe to call without `await` when
 * you don't need to wait for the result.
 *
 * @param order  The confirmed order document.
 * @param paymentMethod  Payment method identifier (cod / icici / razorpay).
 * @param logger  Optional Fastify-compatible logger for structured error output.
 */
export async function sendOrderConfirmationEmail(
  order: IOrderDocument,
  paymentMethod: string,
  logger?: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void },
): Promise<void> {
  try {
    const customer = await getCustomerInfo(order.userId);
    if (!customer) {
      logger?.error(
        { orderId: order._id, userId: String(order.userId) },
        '[OrderEmail] Cannot send confirmation — customer not found',
      );
      return;
    }

    const config = getConfig();
    const { subject, htmlBody } = buildOrderConfirmationEmail({
      order,
      customerName: customer.name,
      customerEmail: customer.email,
      frontendUrl: config.FRONTEND_URL,
      paymentMethod,
    });

    await sendMail(
      { to: { address: customer.email, name: customer.name }, subject, htmlBody },
      logger,
    );
  } catch (err) {
    // Absolute safety net — this function must never throw.
    logger?.error({ err, orderId: order._id }, '[OrderEmail] Unexpected error in sendOrderConfirmationEmail');
  }
}
