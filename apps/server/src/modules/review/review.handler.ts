/**
 * Review request handlers — thin controllers calling service layer.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './review.service.js';
import { APP_CONFIG } from '../../constants/index.js';

// ---------- Storefront handlers (public) ----------

export async function listForProduct(request: FastifyRequest, reply: FastifyReply) {
  const { productId } = request.params as { productId: string };
  const q = request.query as { page?: string; limit?: string; sortBy?: string };
  const page = Math.max(1, parseInt(q.page ?? '1', 10) || 1);
  const limit = Math.min(
    APP_CONFIG.MAX_PAGE_SIZE,
    Math.max(1, parseInt(q.limit ?? String(APP_CONFIG.DEFAULT_PAGE_SIZE), 10) || APP_CONFIG.DEFAULT_PAGE_SIZE),
  );

  const result = await service.listProductReviews(productId, page, limit, q.sortBy);
  return reply.status(200).send({ success: true, ...result, statusCode: 200 });
}

export async function statsForProduct(request: FastifyRequest, reply: FastifyReply) {
  const { productId } = request.params as { productId: string };
  const result = await service.getReviewStats(productId);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

// ---------- Customer handlers ----------

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const data = request.body as service.CreateReviewInput;
  const result = await service.createReview(userId, data);
  return reply.status(201).send({ success: true, data: result, statusCode: 201 });
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };
  const data = request.body as service.UpdateReviewInput;
  const result = await service.updateReview(userId, id, data);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };
  const result = await service.deleteReview(userId, id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

// ---------- Admin handlers ----------

export async function listAll(request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as {
    page?: string;
    limit?: string;
    status?: string;
    productId?: string;
  };
  const page = Math.max(1, parseInt(q.page ?? '1', 10) || 1);
  const limit = Math.min(
    APP_CONFIG.MAX_PAGE_SIZE,
    Math.max(1, parseInt(q.limit ?? String(APP_CONFIG.DEFAULT_PAGE_SIZE), 10) || APP_CONFIG.DEFAULT_PAGE_SIZE),
  );

  const result = await service.listAllReviews(page, limit, q.status, q.productId);
  return reply.status(200).send({ success: true, ...result, statusCode: 200 });
}

export async function approve(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await service.approveReview(id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function flag(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await service.flagReview(id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function adminDelete(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await service.adminDeleteReview(id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}
