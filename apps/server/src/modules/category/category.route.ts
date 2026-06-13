/**
 * Category route plugin.
 * Admin: CRUD operations on categories.
 * Storefront: Tree view and slug-based retrieval.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import * as handler from './category.handler.js';
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  CategoryIdParams,
  CategoryListQuery,
  CategorySlugParams,
} from './category.schema.js';

export default fp(async function categoryRoutes(fastify: FastifyInstance) {
  // ---------- Admin routes ----------
  fastify.post('/api/v1/admin/categories', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      body: CreateCategoryBody,
      tags: ['Admin - Categories'],
      summary: 'Create a new category',
    },
  }, handler.create);

  fastify.get('/api/v1/admin/categories', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      querystring: CategoryListQuery,
      tags: ['Admin - Categories'],
      summary: 'List all categories',
    },
  }, handler.list);

  fastify.get('/api/v1/admin/categories/:id', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: CategoryIdParams,
      tags: ['Admin - Categories'],
      summary: 'Get category by ID',
    },
  }, handler.getById);

  fastify.put('/api/v1/admin/categories/:id', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: CategoryIdParams,
      body: UpdateCategoryBody,
      tags: ['Admin - Categories'],
      summary: 'Update a category',
    },
  }, handler.update);

  fastify.delete('/api/v1/admin/categories/:id', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: CategoryIdParams,
      tags: ['Admin - Categories'],
      summary: 'Delete a category',
    },
  }, handler.remove);

  // ---------- Storefront routes ----------
  fastify.get('/api/v1/storefront/categories', {
    schema: {
      tags: ['Storefront - Categories'],
      summary: 'Get category tree',
    },
  }, handler.tree);

  fastify.get('/api/v1/storefront/categories/:slug', {
    schema: {
      params: CategorySlugParams,
      tags: ['Storefront - Categories'],
      summary: 'Get category by slug',
    },
  }, handler.getBySlug);
});
