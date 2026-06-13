import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyRazorpayPayment, handleWebhook, getPaymentByOrderId } from './payment.service.js';

export async function verify(request: FastifyRequest, reply: FastifyReply) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = request.body as {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  };

  const result = await verifyRazorpayPayment({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  return reply.status(200).send(result);
}

export async function webhook(request: FastifyRequest, reply: FastifyReply) {
  // Razorpay sends signature in the headers
  const signature = request.headers['x-razorpay-signature'] as string;
  if (!signature) {
    return reply.status(400).send({ error: 'Missing signature' });
  }

  // Fastify parses the body to an object if it's JSON.
  // We need the raw body string to verify the HMAC signature.
  // Using JSON.stringify(request.body) works assuming the order of keys matches,
  // but Fastify can be configured with rawBody. Assuming simple JSON stringify for now.
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

export async function getStatus(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const { orderId } = request.params as { orderId: string };

  const result = await getPaymentByOrderId(orderId, userId);
  return reply.status(200).send(result);
}
