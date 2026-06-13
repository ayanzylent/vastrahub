/**
 * SKU route plugin.
 * Admin: CRUD operations and stock management for SKUs.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import * as handler from './sku.handler.js';
import {
  CreateSkuBody,
  UpdateSkuBody,
  UpdateStockBody,
  GenerateSkuCodeBody,
  SkuIdParams,
  ProductIdParams,
} from './sku.schema.js';

export default fp(async function skuRoutes(fastify: FastifyInstance) {
  // ---------- Admin routes ----------
  fastify.post('/api/v1/admin/products/:productId/skus', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: ProductIdParams,
      body: CreateSkuBody,
      tags: ['Admin - SKUs'],
      summary: 'Create a SKU for a product',
    },
  }, handler.create);

  fastify.get('/api/v1/admin/products/:productId/skus', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: ProductIdParams,
      tags: ['Admin - SKUs'],
      summary: 'List SKUs for a product',
    },
  }, handler.listForProduct);

  fastify.put('/api/v1/admin/skus/:id', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: SkuIdParams,
      body: UpdateSkuBody,
      tags: ['Admin - SKUs'],
      summary: 'Update a SKU',
    },
  }, handler.update);

  fastify.delete('/api/v1/admin/skus/:id', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: SkuIdParams,
      tags: ['Admin - SKUs'],
      summary: 'Delete a SKU',
    },
  }, handler.remove);

  fastify.put('/api/v1/admin/skus/:id/stock', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: SkuIdParams,
      body: UpdateStockBody,
      tags: ['Admin - SKUs'],
      summary: 'Update SKU stock quantity',
    },
  }, handler.updateStock);

  fastify.post('/api/v1/admin/products/:productId/skus/generate-code', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: ProductIdParams,
      body: GenerateSkuCodeBody,
      tags: ['Admin - SKUs'],
      summary: 'Auto-generate a unique SKU code',
    },
  }, handler.generateCode);

  // ---------- Storefront routes ----------
  fastify.get('/api/v1/storefront/skus/:id', {
    schema: {
      params: SkuIdParams,
      tags: ['Storefront - SKUs'],
      summary: 'Get SKU details by ID for checkout',
    },
  }, handler.getStorefrontSku);
});
