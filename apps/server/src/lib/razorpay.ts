/**
 * Razorpay SDK wrapper.
 * Provides a singleton Razorpay instance and helper functions.
 * Validates env vars at runtime (not startup) so the server boots without them.
 */

import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { getConfig } from '../config/env.js';
import { ValidationError } from './errors.js';

let _instance: Razorpay | null = null;

/**
 * Get or create the Razorpay instance.
 * Throws if RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET are missing.
 */
export function getRazorpay(): Razorpay {
  if (_instance) return _instance;

  const config = getConfig();
  if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
    throw new ValidationError(
      'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env',
      'RAZORPAY_NOT_CONFIGURED',
    );
  }

  _instance = new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET,
  });

  return _instance;
}

/**
 * Verify Razorpay payment signature.
 * @see https://razorpay.com/docs/payments/server-integration/nodejs/payment-verification/
 */
export function verifyPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const config = getConfig();
  if (!config.RAZORPAY_KEY_SECRET) {
    throw new ValidationError('Razorpay key secret is not configured');
  }

  const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  return expectedSignature === params.razorpaySignature;
}

/**
 * Verify Razorpay webhook signature.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  const config = getConfig();
  if (!config.RAZORPAY_WEBHOOK_SECRET) {
    throw new ValidationError('Razorpay webhook secret is not configured');
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
}
