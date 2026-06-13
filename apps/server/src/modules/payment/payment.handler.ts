import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  verifyRazorpayPayment,
  verifyIciciPayment,
  handleWebhook,
  handleIciciWebhook,
  getPaymentByOrderId,
} from './payment.service.js';
import { mockIciciPaymentResponse } from '../../lib/icici.js';

export async function verify(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as {
    gatewayName?: 'razorpay' | 'icici';
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    iciciOrderId?: string;
    iciciPaymentId?: string;
    iciciSignature?: string;
  };

  const gateway = body.gatewayName || (body.iciciOrderId ? 'icici' : 'razorpay');

  if (gateway === 'icici') {
    if (!body.iciciOrderId || !body.iciciPaymentId || !body.iciciSignature) {
      return reply.status(400).send({ error: 'Missing ICICI payment verification fields' });
    }
    const result = await verifyIciciPayment({
      iciciOrderId: body.iciciOrderId,
      iciciPaymentId: body.iciciPaymentId,
      iciciSignature: body.iciciSignature,
    });
    return reply.status(200).send(result);
  } else {
    if (!body.razorpayOrderId || !body.razorpayPaymentId || !body.razorpaySignature) {
      return reply.status(400).send({ error: 'Missing Razorpay payment verification fields' });
    }
    const result = await verifyRazorpayPayment({
      razorpayOrderId: body.razorpayOrderId,
      razorpayPaymentId: body.razorpayPaymentId,
      razorpaySignature: body.razorpaySignature,
    });
    return reply.status(200).send(result);
  }
}

export async function razorpayWebhook(request: FastifyRequest, reply: FastifyReply) {
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
}

export async function iciciWebhook(request: FastifyRequest, reply: FastifyReply) {
  const signature = request.headers['x-icici-signature'] as string || request.headers['x-merchant-signature'] as string;
  if (!signature) {
    return reply.status(400).send({ error: 'Missing signature' });
  }

  let rawBody: string;
  if (typeof request.body === 'string') {
    rawBody = request.body;
  } else {
    rawBody = JSON.stringify(request.body);
  }

  const result = await handleIciciWebhook(rawBody, signature);
  
  if (!result.received) {
    return reply.status(400).send({ error: 'Invalid webhook signature' });
  }

  return reply.status(200).send({ status: 'ok' });
}

export async function getStatus(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const { orderId } = request.params as { orderId: string };

  const result = await getPaymentByOrderId(orderId, userId);
  return reply.status(200).send(result);
}

export async function simulateIcici(request: FastifyRequest, reply: FastifyReply) {
  const { iciciOrderId } = request.body as { iciciOrderId: string };
  if (!iciciOrderId) {
    return reply.status(400).send({ error: 'Missing iciciOrderId' });
  }
  const result = mockIciciPaymentResponse(iciciOrderId);
  return reply.status(200).send(result);
}

