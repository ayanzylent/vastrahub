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
      summary: 'Verify payment signature (Razorpay or ICICI)',
    },
  }, handler.verify);

  fastify.post('/api/v1/payment/simulate-icici', {
    preHandler: [authenticate],
    schema: {
      tags: ['Payment'],
      summary: 'Simulate ICICI Bank payment response signature',
    },
  }, handler.simulateIcici);

  fastify.post('/api/v1/payment/webhook/razorpay', {
    schema: {
      tags: ['Payment'],
      summary: 'Razorpay webhook handler',
    },
  }, handler.razorpayWebhook);

  fastify.post('/api/v1/payment/webhook/icici', {
    schema: {
      tags: ['Payment'],
      summary: 'ICICI webhook handler',
    },
  }, handler.iciciWebhook);

  fastify.get('/api/v1/payment/:orderId', {
    preHandler: [authenticate],
    schema: {
      params: PaymentOrderIdParams,
      tags: ['Payment'],
      summary: 'Get payment status for an order',
    },
  }, handler.getStatus);
});
