/**
 * ICICI Bank Payment Gateway mock utility wrapper.
 * Provides functions to generate mock ICICI transaction/order IDs and verify signatures.
 */

import crypto from 'node:crypto';
import { getConfig } from '../config/env.js';
import { ValidationError } from './errors.js';

export interface IciciOrder {
  id: string;
  amount: number;
  currency: string;
  merchantId: string;
}

/**
 * Mock creation of an ICICI Bank Payment Gateway transaction order.
 * Throws if ICICI settings are not configured.
 */
export function createIciciOrder(amount: number, currency: string, receipt: string): IciciOrder {
  const config = getConfig();
  if (!config.ICICI_MERCHANT_ID || !config.ICICI_SHARED_SECRET) {
    throw new ValidationError(
      'ICICI is not configured. Set ICICI_MERCHANT_ID and ICICI_SHARED_SECRET in .env',
      'ICICI_NOT_CONFIGURED',
    );
  }

  // Generate a mock ICICI transaction order ID
  const id = `icici_ord_${crypto.randomBytes(8).toString('hex')}`;

  return {
    id,
    amount,
    currency,
    merchantId: config.ICICI_MERCHANT_ID,
  };
}

/**
 * Verify payment response signature for ICICI Bank payment gateway.
 */
export function verifyIciciPaymentSignature(params: {
  iciciOrderId: string;
  iciciPaymentId: string;
  iciciSignature: string;
}): boolean {
  const config = getConfig();
  if (!config.ICICI_SHARED_SECRET) {
    throw new ValidationError('ICICI shared secret is not configured');
  }

  // Generate signature using ICICI_SHARED_SECRET
  const body = `${params.iciciOrderId}|${params.iciciPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', config.ICICI_SHARED_SECRET)
    .update(body)
    .digest('hex');

  return expectedSignature === params.iciciSignature;
}

/**
 * Verify ICICI Bank webhook signature.
 */
export function verifyIciciWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  const config = getConfig();
  const webhookSecret = config.ICICI_WEBHOOK_SECRET || config.ICICI_SHARED_SECRET;
  if (!webhookSecret) {
    throw new ValidationError('ICICI webhook secret or shared secret is not configured');
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Generate a mock payment response signature for ICICI Bank payment gateway testing.
 */
export function mockIciciPaymentResponse(iciciOrderId: string) {
  const config = getConfig();
  if (!config.ICICI_SHARED_SECRET) {
    throw new ValidationError('ICICI shared secret is not configured');
  }

  const iciciPaymentId = `icici_pay_${crypto.randomBytes(8).toString('hex')}`;
  const body = `${iciciOrderId}|${iciciPaymentId}`;
  const iciciSignature = crypto
    .createHmac('sha256', config.ICICI_SHARED_SECRET)
    .update(body)
    .digest('hex');

  return {
    iciciOrderId,
    iciciPaymentId,
    iciciSignature,
  };
}
