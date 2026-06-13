/**
 * Wishlist request handlers — requires authentication.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './wishlist.service.js';
import { UnauthorizedError } from '../../lib/errors.js';

export async function get(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new UnauthorizedError();
  const result = await service.getWishlist(request.user.id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function add(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new UnauthorizedError();
  const { productId } = request.params as { productId: string };
  const result = await service.addItem(request.user.id, productId);
  return reply.status(201).send({ success: true, data: result, statusCode: 201 });
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new UnauthorizedError();
  const { productId } = request.params as { productId: string };
  const result = await service.removeItem(request.user.id, productId);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}
