/**
 * CORS plugin configuration.
 */

import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import { getConfig } from '../config/env.js';

export default fp(
  async function corsPlugin(fastify: FastifyInstance) {
    const config = getConfig();

    await fastify.register(cors, {
      origin: config.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Guest-Id', 'x-guest-id'],
      exposedHeaders: ['Set-Cookie'],
      maxAge: 86400, // 24 hours
    });
  },
  { name: 'cors-plugin' },
);
