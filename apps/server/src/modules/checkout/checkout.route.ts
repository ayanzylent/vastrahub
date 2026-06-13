import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as handler from './checkout.handler.js';
import { CreateOrderBody, BuyNowBody } from './checkout.schema.js';

export default fp(async function checkoutRoutes(fastify: FastifyInstance) {
  fastify.post('/api/v1/checkout/validate', {
    preHandler: [authenticate],
    schema: {
      tags: ['Checkout'],
      summary: 'Validate cart for checkout',
    },
  }, handler.validate);

  fastify.post('/api/v1/checkout/create-order', {
    preHandler: [authenticate],
    schema: {
      body: CreateOrderBody,
      tags: ['Checkout'],
      summary: 'Create order from cart',
    },
  }, handler.createOrderHandler);

  fastify.post('/api/v1/checkout/buy-now', {
    preHandler: [authenticate],
    schema: {
      body: BuyNowBody,
      tags: ['Checkout'],
      summary: 'Create order directly from single SKU (Buy Now)',
    },
  }, handler.buyNowHandler);
});
