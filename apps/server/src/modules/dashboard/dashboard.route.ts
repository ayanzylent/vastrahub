/**
 * Dashboard route plugin.
 * Admin only: overview stats and recent orders.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import * as handler from './dashboard.handler.js';
import { RecentOrdersQuery } from './dashboard.schema.js';

export default fp(async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/admin/dashboard/stats', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      tags: ['Admin - Dashboard'],
      summary: 'Get dashboard stats',
    },
  }, handler.stats);

  fastify.get('/api/v1/admin/dashboard/recent-orders', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      querystring: RecentOrdersQuery,
      tags: ['Admin - Dashboard'],
      summary: 'Get recent orders',
    },
  }, handler.recentOrders);
});
