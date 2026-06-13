/**
 * Media route plugin.
 * Admin only: presigned upload URLs and media deletion.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import * as handler from './media.handler.js';
import { InitiateUploadBody } from './media.schema.js';

export default fp(async function mediaRoutes(fastify: FastifyInstance) {
  fastify.post('/api/v1/media/upload-url', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      body: InitiateUploadBody,
      tags: ['Admin - Media'],
      summary: 'Get presigned upload URL',
    },
  }, handler.uploadUrl);

  fastify.delete('/api/v1/media/*', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      tags: ['Admin - Media'],
      summary: 'Delete a media object',
    },
  }, handler.deleteMedia);
});
