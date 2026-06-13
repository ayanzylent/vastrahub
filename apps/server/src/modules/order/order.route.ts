/**
 * Order route plugin.
 * Customer: list, view, cancel, return-request.
 * Admin: list-all, view, status-update, shipping-update, refund.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import * as handler from './order.handler.js';
import {
  OrderIdParams,
  OrderListQuery,
  CancelOrderBody,
  ReturnRequestBody,
  AdminOrderListQuery,
  UpdateOrderStatusBody,
  UpdateShippingBody,
  RefundBody,
} from './order.schema.js';

export default fp(async function orderRoutes(fastify: FastifyInstance) {
  // ---------- Customer routes ----------
  fastify.get('/api/v1/orders', {
    preHandler: [authenticate],
    schema: {
      querystring: OrderListQuery,
      tags: ['Orders'],
      summary: 'List my orders',
    },
  }, handler.listMine);

  fastify.get('/api/v1/orders/:id', {
    preHandler: [authenticate],
    schema: {
      params: OrderIdParams,
      tags: ['Orders'],
      summary: 'Get my order by ID',
    },
  }, handler.getMine);

  fastify.post('/api/v1/orders/:id/cancel', {
    preHandler: [authenticate],
    schema: {
      params: OrderIdParams,
      body: CancelOrderBody,
      tags: ['Orders'],
      summary: 'Cancel my order',
    },
  }, handler.cancelMine);

  fastify.post('/api/v1/orders/:id/return', {
    preHandler: [authenticate],
    schema: {
      params: OrderIdParams,
      body: ReturnRequestBody,
      tags: ['Orders'],
      summary: 'Request return for my order',
    },
  }, handler.requestReturnMine);

  // ---------- Admin routes ----------
  fastify.get('/api/v1/admin/orders', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      querystring: AdminOrderListQuery,
      tags: ['Admin - Orders'],
      summary: 'List all orders',
    },
  }, handler.listAll);

  fastify.get('/api/v1/admin/orders/:id', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: OrderIdParams,
      tags: ['Admin - Orders'],
      summary: 'Get order by ID',
    },
  }, handler.getById);

  fastify.put('/api/v1/admin/orders/:id/status', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: OrderIdParams,
      body: UpdateOrderStatusBody,
      tags: ['Admin - Orders'],
      summary: 'Update order status',
    },
  }, handler.updateStatus);

  fastify.put('/api/v1/admin/orders/:id/shipping', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: OrderIdParams,
      body: UpdateShippingBody,
      tags: ['Admin - Orders'],
      summary: 'Update shipping info',
    },
  }, handler.updateShipping);

  fastify.post('/api/v1/admin/orders/:id/refund', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: OrderIdParams,
      body: RefundBody,
      tags: ['Admin - Orders'],
      summary: 'Initiate refund',
    },
  }, handler.refund);
});
