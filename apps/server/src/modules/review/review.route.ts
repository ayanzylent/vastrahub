/**
 * Review route plugin.
 * Storefront: public product review listing and stats.
 * Customer: create, update, delete own reviews.
 * Admin: list all, approve, flag, delete any review.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import * as handler from './review.handler.js';
import {
  ReviewIdParams,
  ProductReviewsParams,
  ProductReviewsQuery,
  AdminReviewListQuery,
  CreateReviewBody,
  UpdateReviewBody,
} from './review.schema.js';

export default fp(async function reviewRoutes(fastify: FastifyInstance) {
  // ---------- Storefront routes (public) ----------
  fastify.get('/api/v1/storefront/products/:productId/reviews', {
    schema: {
      params: ProductReviewsParams,
      querystring: ProductReviewsQuery,
      tags: ['Storefront - Reviews'],
      summary: 'List reviews for a product',
    },
  }, handler.listForProduct);

  fastify.get('/api/v1/storefront/products/:productId/reviews/stats', {
    schema: {
      params: ProductReviewsParams,
      tags: ['Storefront - Reviews'],
      summary: 'Get review stats for a product',
    },
  }, handler.statsForProduct);

  // ---------- Customer routes ----------
  fastify.post('/api/v1/reviews', {
    preHandler: [authenticate],
    schema: {
      body: CreateReviewBody,
      tags: ['Reviews'],
      summary: 'Create a review',
    },
  }, handler.create);

  fastify.put('/api/v1/reviews/:id', {
    preHandler: [authenticate],
    schema: {
      params: ReviewIdParams,
      body: UpdateReviewBody,
      tags: ['Reviews'],
      summary: 'Update my review',
    },
  }, handler.update);

  fastify.delete('/api/v1/reviews/:id', {
    preHandler: [authenticate],
    schema: {
      params: ReviewIdParams,
      tags: ['Reviews'],
      summary: 'Delete my review',
    },
  }, handler.remove);

  // ---------- Admin routes ----------
  fastify.get('/api/v1/admin/reviews', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      querystring: AdminReviewListQuery,
      tags: ['Admin - Reviews'],
      summary: 'List all reviews',
    },
  }, handler.listAll);

  fastify.put('/api/v1/admin/reviews/:id/approve', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: ReviewIdParams,
      tags: ['Admin - Reviews'],
      summary: 'Approve a review',
    },
  }, handler.approve);

  fastify.put('/api/v1/admin/reviews/:id/flag', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: ReviewIdParams,
      tags: ['Admin - Reviews'],
      summary: 'Flag a review',
    },
  }, handler.flag);

  fastify.delete('/api/v1/admin/reviews/:id', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: ReviewIdParams,
      tags: ['Admin - Reviews'],
      summary: 'Delete any review (admin)',
    },
  }, handler.adminDelete);
});
