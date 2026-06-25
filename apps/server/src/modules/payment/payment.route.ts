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

  /*
  fastify.post('/api/v1/payment/webhook/razorpay', {
    schema: {
      tags: ['Payment'],
      summary: 'Razorpay webhook handler',
    },
  }, handler.razorpayWebhook);
  */

  fastify.post('/api/v1/payment/webhook/icici', {
    schema: {
      tags: ['Payment'],
      summary: 'ICICI server-to-server webhook (Payment Advice)',
    },
  }, handler.iciciWebhook);

  // Browser return URL ICICI POSTs the result to (public; verified via secureHash).
  fastify.post('/api/v1/payment/icici/callback', {
    schema: {
      tags: ['Payment'],
      summary: 'ICICI hosted-page return callback (redirects to storefront)',
    },
  }, handler.iciciCallback);

  // Poll live ICICI status for an order (resolves "processing" payments).
  fastify.get('/api/v1/payment/icici/status/:orderId', {
    preHandler: [authenticate],
    schema: {
      params: PaymentOrderIdParams,
      tags: ['Payment'],
      summary: 'Query and reconcile ICICI payment status for an order',
    },
  }, handler.iciciStatus);

  fastify.get('/api/v1/payment/:orderId', {
    preHandler: [authenticate],
    schema: {
      params: PaymentOrderIdParams,
      tags: ['Payment'],
      summary: 'Get payment status for an order',
    },
  }, handler.getStatus);
});
