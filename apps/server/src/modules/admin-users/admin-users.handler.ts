/**
 * Admin Users Handlers.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './admin-users.service.js';

export async function list(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query = request.query as { page?: string; limit?: string; search?: string };
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10) || 20));
  const search = query.search?.trim() || undefined;

  const result = await service.listUsers(page, limit, search);

  return reply.send({
    success: true,
    data: result.users,
    pagination: {
      page: result.page,
      limit,
      total: result.total,
      totalPages: result.totalPages,
      hasNextPage: result.page < result.totalPages,
      hasPrevPage: result.page > 1,
    },
    statusCode: 200,
  });
}

export async function getById(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { id: string };
  const user = await service.getUserById(params.id);
  return reply.send({
    success: true,
    data: user,
    statusCode: 200,
  });
}

export async function updateRole(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { id: string };
  const body = request.body as { role: string };
  const user = await service.updateUserRole(params.id, body.role);
  return reply.send({
    success: true,
    data: user,
    statusCode: 200,
  });
}
