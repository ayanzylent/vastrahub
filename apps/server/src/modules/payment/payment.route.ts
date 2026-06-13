import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as handler from './payment.handler.js';
import { VerifyPaymentBody, PaymentOrderIdParams } from './payment.schema.js';

export default fp(async function paymentRoutes(fastify: FastifyInstance) {
  fastify.post('/api/v1/payment/verify', {
    preHandler: [authenticate],
    schema: {
      body: VerifyPaymentBody,
      tags: ['Payment'],
      summary: 'Verify Razorpay payment signature',
    },
  }, handler.verify);

  // Webhook has no body schema — Razorpay payload varies and raw body is needed for HMAC
  fastify.post('/api/v1/payment/webhook', {
    schema: {
      tags: ['Payment'],
      summary: 'Razorpay webhook handler',
    },
  }, handler.webhook);

  fastify.get('/api/v1/payment/:orderId', {
    preHandler: [authenticate],
    schema: {
      params: PaymentOrderIdParams,
      tags: ['Payment'],
      summary: 'Get payment status for an order',
    },
  }, handler.getStatus);
});
