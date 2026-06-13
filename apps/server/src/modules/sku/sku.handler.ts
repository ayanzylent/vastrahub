/**
 * SKU request handlers — thin controllers calling service layer.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './sku.service.js';

// ---------- Admin handlers ----------

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const { productId } = request.params as { productId: string };
  const data = request.body as service.CreateSkuInput;
  const result = await service.createSku(productId, data);
  return reply.status(201).send({ success: true, data: result, statusCode: 201 });
}

export async function listForProduct(request: FastifyRequest, reply: FastifyReply) {
  const { productId } = request.params as { productId: string };
  const result = await service.listSkusForProduct(productId);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = request.body as service.UpdateSkuInput;
  const result = await service.updateSku(id, data);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  await service.deleteSku(id);
  return reply.status(200).send({ success: true, data: { deleted: true }, statusCode: 200 });
}

export async function updateStock(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { quantity } = request.body as { quantity: number };
  const result = await service.updateStock(id, quantity);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function generateCode(request: FastifyRequest, reply: FastifyReply) {
  const { productId } = request.params as { productId: string };
  const { attributes } = request.body as { attributes: Record<string, string> };
  const code = await service.generateSkuCode(productId, attributes ?? {});
  return reply.status(200).send({ success: true, data: { sku: code }, statusCode: 200 });
}
