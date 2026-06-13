/**
 * Wishlist route plugin.
 * All routes require authentication.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as handler from './wishlist.handler.js';
import { WishlistProductParams } from './wishlist.schema.js';

export default fp(async function wishlistRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/user/wishlist', {
    preHandler: [authenticate],
    schema: {
      tags: ['Wishlist'],
      summary: 'Get my wishlist',
    },
  }, handler.get);

  fastify.post('/api/v1/user/wishlist/:productId', {
    preHandler: [authenticate],
    schema: {
      params: WishlistProductParams,
      tags: ['Wishlist'],
      summary: 'Add product to wishlist',
    },
  }, handler.add);

  fastify.delete('/api/v1/user/wishlist/:productId', {
    preHandler: [authenticate],
    schema: {
      params: WishlistProductParams,
      tags: ['Wishlist'],
      summary: 'Remove product from wishlist',
    },
  }, handler.remove);
});
