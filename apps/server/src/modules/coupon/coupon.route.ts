/**
 * Coupon route plugin.
 * Admin: CRUD, toggle active status.
 * Storefront: Validate coupon for cart.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import * as handler from './coupon.handler.js';
import {
  CouponIdParams,
  CouponListQuery,
  CreateCouponBody,
  UpdateCouponBody,
  ValidateCouponBody,
} from './coupon.schema.js';

export default fp(async function couponRoutes(fastify: FastifyInstance) {
  // ---------- Admin routes ----------
  fastify.get('/api/v1/admin/coupons', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      querystring: CouponListQuery,
      tags: ['Admin - Coupons'],
      summary: 'List all coupons',
    },
  }, handler.list);

  fastify.get('/api/v1/admin/coupons/:id', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: CouponIdParams,
      tags: ['Admin - Coupons'],
      summary: 'Get coupon by ID',
    },
  }, handler.getById);

  fastify.post('/api/v1/admin/coupons', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      body: CreateCouponBody,
      tags: ['Admin - Coupons'],
      summary: 'Create a new coupon',
    },
  }, handler.create);

  fastify.put('/api/v1/admin/coupons/:id', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: CouponIdParams,
      body: UpdateCouponBody,
      tags: ['Admin - Coupons'],
      summary: 'Update a coupon',
    },
  }, handler.update);

  fastify.delete('/api/v1/admin/coupons/:id', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: CouponIdParams,
      tags: ['Admin - Coupons'],
      summary: 'Delete a coupon',
    },
  }, handler.remove);

  fastify.put('/api/v1/admin/coupons/:id/toggle', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: CouponIdParams,
      tags: ['Admin - Coupons'],
      summary: 'Toggle coupon active status',
    },
  }, handler.toggleActive);

  // ---------- Storefront routes ----------
  fastify.post('/api/v1/storefront/coupons/validate', {
    preHandler: [authenticate],
    schema: {
      body: ValidateCouponBody,
      tags: ['Storefront - Coupons'],
      summary: 'Validate coupon for cart',
    },
  }, handler.validateForCart);
});
