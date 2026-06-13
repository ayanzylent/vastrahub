/**
 * Cart request handlers.
 * Uses flexible auth — works with and without session.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { getAuth } from '../../plugins/auth.plugin.js';
import * as service from './cart.service.js';
import type { CartOwner } from './cart.service.js';
import { ValidationError } from '../../lib/errors.js';

// ---------- Helper ----------

/**
 * Determine cart owner from session (if authenticated) or X-Guest-Id header.
 */
async function getCartOwner(request: FastifyRequest): Promise<CartOwner> {
  try {
    const auth = getAuth();
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (value) {
        headers.set(key, Array.isArray(value) ? value[0]! : value);
      }
    }

    const session = await auth.api.getSession({ headers });
    if (session?.user) {
      return { userId: session.user.id as string };
    }
  } catch {
    // Not authenticated — use guest flow
  }

  const guestId = request.headers['x-guest-id'] as string | undefined;
  if (!guestId) {
    throw new ValidationError('Authentication or X-Guest-Id header is required');
  }
  return { guestId };
}

// ---------- Handlers ----------

export async function get(request: FastifyRequest, reply: FastifyReply) {
  const owner = await getCartOwner(request);
  const result = await service.getCart(owner);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function addItem(request: FastifyRequest, reply: FastifyReply) {
  const owner = await getCartOwner(request);
  const body = request.body as { skuId: string; quantity: number };
  const result = await service.addItem(owner, body);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function updateItem(request: FastifyRequest, reply: FastifyReply) {
  const owner = await getCartOwner(request);
  const { skuId } = request.params as { skuId: string };
  const { quantity } = request.body as { quantity: number };
  const result = await service.updateItemQuantity(owner, skuId, quantity);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function removeItem(request: FastifyRequest, reply: FastifyReply) {
  const owner = await getCartOwner(request);
  const { skuId } = request.params as { skuId: string };
  const result = await service.removeItem(owner, skuId);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function clear(request: FastifyRequest, reply: FastifyReply) {
  const owner = await getCartOwner(request);
  const result = await service.clearCart(owner);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function merge(request: FastifyRequest, reply: FastifyReply) {
  // Merge requires auth
  const auth = getAuth();
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value[0]! : value);
    }
  }

  const session = await auth.api.getSession({ headers });
  if (!session?.user) {
    throw new ValidationError('Authentication required to merge carts');
  }

  const { guestId } = request.body as { guestId: string };
  const result = await service.mergeGuestCart(guestId, session.user.id as string);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}
