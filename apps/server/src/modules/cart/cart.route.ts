/**
 * Cart route plugin.
 * No preHandler auth — flexible auth handled in handler layer.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import * as handler from './cart.handler.js';
import {
  SkuIdParams,
  AddCartItemBody,
  UpdateCartItemBody,
  MergeCartBody,
} from './cart.schema.js';

export default fp(async function cartRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/cart', {
    schema: {
      tags: ['Cart'],
      summary: 'Get current cart',
    },
  }, handler.get);

  fastify.post('/api/v1/cart/items', {
    schema: {
      body: AddCartItemBody,
      tags: ['Cart'],
      summary: 'Add item to cart',
    },
  }, handler.addItem);

  fastify.put('/api/v1/cart/items/:skuId', {
    schema: {
      params: SkuIdParams,
      body: UpdateCartItemBody,
      tags: ['Cart'],
      summary: 'Update cart item quantity',
    },
  }, handler.updateItem);

  fastify.delete('/api/v1/cart/items/:skuId', {
    schema: {
      params: SkuIdParams,
      tags: ['Cart'],
      summary: 'Remove item from cart',
    },
  }, handler.removeItem);

  fastify.delete('/api/v1/cart', {
    schema: {
      tags: ['Cart'],
      summary: 'Clear cart',
    },
  }, handler.clear);

  fastify.post('/api/v1/cart/merge', {
    schema: {
      body: MergeCartBody,
      tags: ['Cart'],
      summary: 'Merge guest cart into user cart',
    },
  }, handler.merge);
});
