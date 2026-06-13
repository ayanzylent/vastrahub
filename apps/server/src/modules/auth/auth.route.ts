/**
 * Auth route plugin.
 * Provides current user info for authenticated users.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../../middleware/auth.middleware.js';

export default fp(async function authRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/auth/me', {
    preHandler: [authenticate],
    schema: {
      tags: ['Auth'],
      summary: 'Get current authenticated user',
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      data: request.user,
      statusCode: 200,
    });
  });
}, { name: 'auth-routes' });
