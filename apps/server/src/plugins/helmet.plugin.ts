/**
 * Helmet plugin for security headers.
 */

import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import type { FastifyInstance } from 'fastify';

export default fp(
  async function helmetPlugin(fastify: FastifyInstance) {
    await fastify.register(helmet, {
      contentSecurityPolicy: false, // Managed by frontend
    });
  },
  { name: 'helmet-plugin' },
);
