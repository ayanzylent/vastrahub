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

  const result = await service.listAdmins(page, limit, search);

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

export async function searchCustomers(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query = request.query as { search: string };
  const users = await service.searchCustomers(query.search.trim());
  return reply.send({
    success: true,
    data: users,
    statusCode: 200,
  });
}

export async function promoteToAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as { email: string };
  const user = await service.promoteToAdmin(body.email);
  return reply.send({
    success: true,
    data: user,
    statusCode: 200,
  });
}

export async function revokeAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { id: string };
  const user = await service.revokeAdmin(params.id);
  return reply.send({
    success: true,
    data: user,
    statusCode: 200,
  });
}
