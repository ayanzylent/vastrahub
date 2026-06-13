/**
 * Health check routes.
 * Provides basic health and readiness endpoints.
 */

import type { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';

export default async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /health — basic health check
   */
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Basic health check',
    },
  }, async (_request, _reply) => {
    return {
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  });

  /**
   * GET /health/ready — deep readiness check (includes DB status)
   */
  fastify.get('/health/ready', {
    schema: {
      tags: ['Health'],
      summary: 'Deep readiness check (includes DB)',
    },
  }, async (_request, _reply) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

    const statusCode = dbState === 1 ? 200 : 503;

    return _reply.status(statusCode).send({
      success: dbState === 1,
      status: dbState === 1 ? 'ok' : 'degraded',
      db: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });
}
