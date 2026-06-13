/**
 * Category request handlers — thin controllers calling service layer.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './category.service.js';
import { APP_CONFIG } from '@vastrahub/shared-constants';

// ---------- Admin handlers ----------

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const data = request.body as service.CreateCategoryInput;
  const result = await service.createCategory(data);
  return reply.status(201).send({ success: true, data: result, statusCode: 201 });
}

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as { page?: string; limit?: string; search?: string };
  const page = Math.max(1, parseInt(q.page ?? '1', 10) || 1);
  const limit = Math.min(
    APP_CONFIG.MAX_PAGE_SIZE,
    Math.max(1, parseInt(q.limit ?? String(APP_CONFIG.DEFAULT_PAGE_SIZE), 10) || APP_CONFIG.DEFAULT_PAGE_SIZE),
  );
  const search = q.search;

  const result = await service.listCategories({ page, limit, search });
  return reply.status(200).send({ success: true, ...result, statusCode: 200 });
}

export async function getById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await service.getCategoryById(id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = request.body as service.UpdateCategoryInput;
  const result = await service.updateCategory(id, data);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  await service.deleteCategory(id);
  return reply.status(200).send({ success: true, data: { deleted: true }, statusCode: 200 });
}

// ---------- Storefront handlers ----------

export async function tree(_request: FastifyRequest, reply: FastifyReply) {
  const result = await service.getCategoryTree();
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function getBySlug(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = request.params as { slug: string };
  const result = await service.getCategoryBySlug(slug);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}
