/**
 * Media route plugin.
 * Admin: all contexts. Authenticated customers: review images only.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { ForbiddenError, UnauthorizedError } from '../../lib/errors.js';
import { hasMinimumRole, type UserRoleType } from '../../constants/index.js';
import * as handler from './media.handler.js';
import { InitiateUploadBody, type InitiateUploadBodyType } from './media.schema.js';

/**
 * Allow admin for any upload; non-admin only for review images.
 */
async function allowAdminOrReviewImageUpload(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  if (!request.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const userRole = request.user.role as UserRoleType;
  if (hasMinimumRole(userRole, 'admin')) {
    return;
  }

  const body = request.body as InitiateUploadBodyType | undefined;
  if (body?.context === 'review' && body?.type === 'image') {
    return;
  }

  throw new ForbiddenError('Insufficient permissions');
}

export default fp(async function mediaRoutes(fastify: FastifyInstance) {
  fastify.post('/api/v1/media/upload-url', {
    preHandler: [authenticate, allowAdminOrReviewImageUpload],
    schema: {
      body: InitiateUploadBody,
      tags: ['Media'],
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
