/**
 * Coupon request handlers — thin controllers calling service layer.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './coupon.service.js';
import { APP_CONFIG } from '../../constants/index.js';

// ---------- Admin handlers ----------

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as { page?: string; limit?: string; search?: string; status?: string };
  const page = Math.max(1, parseInt(q.page ?? '1', 10) || 1);
  const limit = Math.min(
    APP_CONFIG.MAX_PAGE_SIZE,
    Math.max(1, parseInt(q.limit ?? String(APP_CONFIG.DEFAULT_PAGE_SIZE), 10) || APP_CONFIG.DEFAULT_PAGE_SIZE),
  );
  const search = q.search;
  const status = q.status;

  const result = await service.listCoupons(page, limit, search, status);
  return reply.status(200).send({ success: true, ...result, statusCode: 200 });
}

export async function getById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await service.getCouponById(id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const data = request.body as service.CreateCouponInput;
  const result = await service.createCoupon(data);
  return reply.status(201).send({ success: true, data: result, statusCode: 201 });
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = request.body as service.UpdateCouponInput;
  const result = await service.updateCoupon(id, data);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  await service.deleteCoupon(id);
  return reply.status(200).send({ success: true, data: { deleted: true }, statusCode: 200 });
}

export async function toggleActive(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await service.toggleCouponActive(id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

// ---------- Storefront handlers ----------

export async function validateForCart(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as {
    code: string;
    cartSubtotalPaise: number;
    cartItemProductIds?: string[];
  };
  const userId = request.user!.id;

  const result = await service.validateAndPreviewCoupon(
    body.code,
    body.cartSubtotalPaise,
    userId,
    body.cartItemProductIds,
  );

  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}
