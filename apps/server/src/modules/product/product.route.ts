/**
 * Product route plugin.
 * Admin: full CRUD, publish/unpublish, slug management.
 * Storefront: filtered listing, slug-based lookup, featured.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import * as handler from './product.handler.js';
import {
  CreateProductBody,
  UpdateProductBody,
  ProductIdParams,
  ProductListQuery,
  SetSlugBody,
  SlugHistoryDeleteParams,
  StorefrontListQuery,
  ProductSlugParams,
  FeaturedQuery,
} from './product.schema.js';

export default fp(async function productRoutes(fastify: FastifyInstance) {
  // ---------- Admin routes ----------
  fastify.post('/api/v1/admin/products', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      body: CreateProductBody,
      tags: ['Admin - Products'],
      summary: 'Create a new product',
    },
  }, handler.create);

  fastify.get('/api/v1/admin/products', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      querystring: ProductListQuery,
      tags: ['Admin - Products'],
      summary: 'List all products',
    },
  }, handler.list);

  fastify.get('/api/v1/admin/products/:id', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: ProductIdParams,
      tags: ['Admin - Products'],
      summary: 'Get product by ID',
    },
  }, handler.getById);

  fastify.put('/api/v1/admin/products/:id', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: ProductIdParams,
      body: UpdateProductBody,
      tags: ['Admin - Products'],
      summary: 'Update a product',
    },
  }, handler.update);

  fastify.delete('/api/v1/admin/products/:id', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: ProductIdParams,
      tags: ['Admin - Products'],
      summary: 'Delete a product',
    },
  }, handler.remove);

  fastify.post('/api/v1/admin/products/:id/publish', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: ProductIdParams,
      tags: ['Admin - Products'],
      summary: 'Publish a product',
    },
  }, handler.publish);

  fastify.post('/api/v1/admin/products/:id/unpublish', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: ProductIdParams,
      tags: ['Admin - Products'],
      summary: 'Unpublish a product',
    },
  }, handler.unpublish);

  fastify.put('/api/v1/admin/products/:id/slug', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: ProductIdParams,
      body: SetSlugBody,
      tags: ['Admin - Products'],
      summary: 'Set manual slug for a product',
    },
  }, handler.setSlug);

  fastify.put('/api/v1/admin/products/:id/slug/auto', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: ProductIdParams,
      tags: ['Admin - Products'],
      summary: 'Auto-generate slug from product name',
    },
  }, handler.autoSlug);

  fastify.get('/api/v1/admin/products/:id/slug/history', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: ProductIdParams,
      tags: ['Admin - Products'],
      summary: 'Get slug change history',
    },
  }, handler.slugHistory);

  fastify.delete('/api/v1/admin/products/:id/slug/history/:oldSlug', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: SlugHistoryDeleteParams,
      tags: ['Admin - Products'],
      summary: 'Remove a slug history entry',
    },
  }, handler.removeSlugHistory);

  // ---------- Storefront routes ----------
  fastify.get('/api/v1/storefront/products', {
    schema: {
      querystring: StorefrontListQuery,
      tags: ['Storefront - Products'],
      summary: 'Browse products with filters',
    },
  }, handler.storefrontList);

  fastify.get('/api/v1/storefront/products/featured', {
    schema: {
      querystring: FeaturedQuery,
      tags: ['Storefront - Products'],
      summary: 'Get featured products',
    },
  }, handler.featured);

  fastify.get('/api/v1/storefront/products/:slug', {
    schema: {
      params: ProductSlugParams,
      tags: ['Storefront - Products'],
      summary: 'Get product by slug',
    },
  }, handler.getBySlug);
});
