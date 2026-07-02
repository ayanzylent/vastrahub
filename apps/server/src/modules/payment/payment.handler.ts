import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  verifyRazorpayPayment,
  handleWebhook,
  handleIciciWebhook,
  handleIciciCallback,
  getIciciPaymentStatusForUser,
  getPaymentByOrderId,
} from './payment.service.js';
import { getConfig } from '../../config/env.js';

export async function verify(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(400).send({ error: 'Razorpay payment verification is disabled.' });
  /*
  const body = request.body as {
    gatewayName?: 'razorpay' | 'icici';
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  };

  // ICICI uses the redirect/callback flow — it is never verified here.
  if (body.gatewayName === 'icici') {
    return reply.status(400).send({
      error: 'ICICI payments are completed via gateway redirect, not client-side verification',
    });
  }

  if (!body.razorpayOrderId || !body.razorpayPaymentId || !body.razorpaySignature) {
    return reply.status(400).send({ error: 'Missing Razorpay payment verification fields' });
  }

  const result = await verifyRazorpayPayment({
    razorpayOrderId: body.razorpayOrderId,
    razorpayPaymentId: body.razorpayPaymentId,
    razorpaySignature: body.razorpaySignature,
  });
  return reply.status(200).send(result);
  */
}

export async function razorpayWebhook(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(400).send({ error: 'Razorpay webhooks are disabled.' });
  /*
  const signature = request.headers['x-razorpay-signature'] as string;
  if (!signature) {
    return reply.status(400).send({ error: 'Missing signature' });
  }

  let rawBody: string;
  if (typeof request.body === 'string') {
    rawBody = request.body;
  } else {
    rawBody = JSON.stringify(request.body);
  }

  const result = await handleWebhook(rawBody, signature);

  if (!result.received) {
    return reply.status(400).send({ error: 'Invalid webhook signature' });
  }

  return reply.status(200).send({ status: 'ok' });
  */
}

/**
 * Server-to-server ICICI webhook (Payment Advice).
 * Body is URL-encoded by default or JSON if configured during onboarding;
 * `@fastify/formbody` parses both into `request.body`. The secureHash travels
 * in the body and is verified there.
 */
export async function iciciWebhook(request: FastifyRequest, reply: FastifyReply) {
  const fields = (request.body ?? {}) as Record<string, unknown>;

  const result = await handleIciciWebhook(fields);

  if (!result.received) {
    return reply.status(400).send({ error: 'Invalid webhook signature' });
  }

  // Per ICICI spec: return HTTP 200 to stop webhook retries.
  return reply.status(200).send({ status: 'ok' });
}

/**
 * Browser return callback: ICICI POSTs the transaction result (form-encoded)
 * to this URL after the buyer completes payment on the hosted page.
 * We verify, reconcile, then 302-redirect the browser to the storefront.
 */
export async function iciciCallback(request: FastifyRequest, reply: FastifyReply) {
  const fields = (request.body ?? {}) as Record<string, unknown>;
  const redirectBase = getFrontendBaseURL();

  try {
    const result = await handleIciciCallback(fields);
    const status =
      result.outcome === 'paid' ? 'paid' : result.outcome === 'failed' ? 'failed' : 'processing';

    const params = new URLSearchParams({ status });
    if (result.orderId) params.set('orderId', String(result.orderId));

    return reply.redirect(`${redirectBase}/checkout/success?${params.toString()}`, 303);
  } catch (err) {
    request.log.error({ err }, 'ICICI callback handling failed');
    const params = new URLSearchParams({ status: 'failed' });
    return reply.redirect(`${redirectBase}/checkout/success?${params.toString()}`, 303);
  }
}

/**
 * Poll the live ICICI status for one of the user's orders and reconcile it.
 * Used by the success page to resolve a payment that is still "processing".
 */
export async function iciciStatus(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const { orderId } = request.params as { orderId: string };

  const result = await getIciciPaymentStatusForUser(orderId, userId);
  return reply.status(200).send(result);
}

export async function getStatus(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const { orderId } = request.params as { orderId: string };

  const result = await getPaymentByOrderId(orderId, userId);
  return reply.status(200).send(result);
}

/** Resolve the storefront base URL (first origin if several are configured). */
function getFrontendBaseURL(): string {
  const config = getConfig();
  return config.FRONTEND_URL.split(',')[0].trim().replace(/\/+$/, '');
}