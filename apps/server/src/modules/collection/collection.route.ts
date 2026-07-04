/**
 * Collection route plugin.
 * Admin: CRUD + product preview.
 * Storefront: list active collections and resolve a single collection's products.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import * as handler from './collection.handler.js';
import {
  CreateCollectionBody,
  UpdateCollectionBody,
  CollectionIdParams,
  CollectionListQuery,
  CollectionPreviewQuery,
  CollectionPreviewDraftBody,
  CollectionSlugParams,
  CollectionProductsQuery,
  StorefrontCollectionListQuery,
} from './collection.schema.js';

export default fp(async function collectionRoutes(fastify: FastifyInstance) {
  // ---------- Admin routes ----------
  fastify.post('/api/v1/admin/collections', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      body: CreateCollectionBody,
      tags: ['Admin - Collections'],
      summary: 'Create a new collection',
    },
  }, handler.create);

  fastify.get('/api/v1/admin/collections', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      querystring: CollectionListQuery,
      tags: ['Admin - Collections'],
      summary: 'List all collections',
    },
  }, handler.list);

  fastify.get('/api/v1/admin/collections/:id', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: CollectionIdParams,
      tags: ['Admin - Collections'],
      summary: 'Get collection by ID',
    },
  }, handler.getById);

  fastify.get('/api/v1/admin/collections/:id/preview', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: CollectionIdParams,
      querystring: CollectionPreviewQuery,
      tags: ['Admin - Collections'],
      summary: 'Preview the products a collection resolves to',
    },
  }, handler.preview);

  fastify.post('/api/v1/admin/collections/preview', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      body: CollectionPreviewDraftBody,
      tags: ['Admin - Collections'],
      summary: 'Preview products for an unsaved collection draft',
    },
  }, handler.previewDraft);

  fastify.put('/api/v1/admin/collections/:id', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: CollectionIdParams,
      body: UpdateCollectionBody,
      tags: ['Admin - Collections'],
      summary: 'Update a collection',
    },
  }, handler.update);

  fastify.delete('/api/v1/admin/collections/:id', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      params: CollectionIdParams,
      tags: ['Admin - Collections'],
      summary: 'Delete a collection',
    },
  }, handler.remove);

  // ---------- Storefront routes ----------
  fastify.get('/api/v1/storefront/collections', {
    schema: {
      querystring: StorefrontCollectionListQuery,
      tags: ['Storefront - Collections'],
      summary: 'List active collections',
    },
  }, handler.storefrontList);

  fastify.get('/api/v1/storefront/collections/:slug', {
    schema: {
      params: CollectionSlugParams,
      querystring: CollectionProductsQuery,
      tags: ['Storefront - Collections'],
      summary: 'Get a collection and its products by slug',
    },
  }, handler.storefrontBySlug);
});
