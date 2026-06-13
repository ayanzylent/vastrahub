/**
 * Dashboard request handlers — admin only.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './dashboard.service.js';

export async function stats(_request: FastifyRequest, reply: FastifyReply) {
  const result = await service.getStats();
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function recentOrders(request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as { limit?: string };
  const limit = Math.min(50, parseInt(q.limit ?? '10', 10) || 10);
  const result = await service.getRecentOrders(limit);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}
