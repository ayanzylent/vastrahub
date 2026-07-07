/**
 * Purge route plugin.
 * Admin endpoint to hard-delete soft-deleted products past their retention window.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import * as handler from './purge.handler.js';
import { PurgeQuery } from './purge.schema.js';

export default fp(async function purgeRoutes(fastify: FastifyInstance) {
  fastify.post('/api/v1/admin/system/purge', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      querystring: PurgeQuery,
      tags: ['Admin - System'],
      summary: 'Purge soft-deleted products past retention window',
      description:
        'Hard-deletes products (and their SKUs, reviews, wishlist/collection refs) ' +
        'whose deletedAt is older than the retention period. ' +
        'Use ?dryRun=true to preview without deleting.',
    },
  }, handler.handlePurge);
});
