/**
 * Order request handlers — thin controllers calling service layer.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './order.service.js';
import { APP_CONFIG } from '../../constants/index.js';

// ---------- Customer handlers ----------

export async function listMine(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const q = request.query as Record<string, string | undefined>;
  const page = Math.max(1, parseInt(q.page ?? '1', 10) || 1);
  const limit = Math.min(
    APP_CONFIG.MAX_PAGE_SIZE,
    Math.max(1, parseInt(q.limit ?? String(APP_CONFIG.DEFAULT_PAGE_SIZE), 10) || APP_CONFIG.DEFAULT_PAGE_SIZE),
  );
  const status = q.status;

  const result = await service.listUserOrders(userId, page, limit, status);
  return reply.status(200).send({ success: true, ...result, statusCode: 200 });
}

export async function getMine(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };
  const result = await service.getUserOrderById(userId, id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function cancelMine(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };
  const body = request.body as { reason?: string } | undefined;
  const result = await service.cancelOrder(userId, id, body?.reason);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function requestReturnMine(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };
  const { reason } = request.body as { reason: string };
  const result = await service.requestReturn(userId, id, reason);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

// ---------- Admin handlers ----------

export async function listAll(request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as Record<string, string | undefined>;
  const page = Math.max(1, parseInt(q.page ?? '1', 10) || 1);
  const limit = Math.min(
    APP_CONFIG.MAX_PAGE_SIZE,
    Math.max(1, parseInt(q.limit ?? String(APP_CONFIG.DEFAULT_PAGE_SIZE), 10) || APP_CONFIG.DEFAULT_PAGE_SIZE),
  );

  const result = await service.listAllOrders(page, limit, q.search, q.status, q.sortBy);
  return reply.status(200).send({ success: true, ...result, statusCode: 200 });
}

export async function getById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await service.getOrderById(id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function updateStatus(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { status, note } = request.body as { status: string; note?: string };
  const changedBy = request.user!.id;
  const result = await service.updateOrderStatus(id, status, changedBy, note);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function updateShipping(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const body = request.body as {
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
  };
  const result = await service.updateShippingInfo(id, body);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function refund(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { amountPaise, reason } = request.body as { amountPaise: number; reason: string };
  const result = await service.initiateRefund(id, amountPaise, reason);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}
