/**
 * User profile request handlers — all require authentication.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './user.service.js';
import type { AddAddressInput, UpdateProfileInput } from './user.service.js';
import { UnauthorizedError } from '../../lib/errors.js';

// ---------- Profile handlers ----------

export async function getProfile(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new UnauthorizedError();
  const result = await service.getProfile(request.user.id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function updateProfile(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new UnauthorizedError();
  const data = request.body as UpdateProfileInput;
  const result = await service.updateProfile(request.user.id, data);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

// ---------- Address handlers ----------

export async function listAddresses(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new UnauthorizedError();
  const result = await service.listAddresses(request.user.id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function addAddress(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new UnauthorizedError();
  const data = request.body as AddAddressInput;
  const result = await service.addAddress(request.user.id, data);
  return reply.status(201).send({ success: true, data: result, statusCode: 201 });
}

export async function updateAddress(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new UnauthorizedError();
  const { id } = request.params as { id: string };
  const data = request.body as Partial<AddAddressInput>;
  const result = await service.updateAddress(request.user.id, id, data);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function deleteAddress(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new UnauthorizedError();
  const { id } = request.params as { id: string };
  const result = await service.deleteAddress(request.user.id, id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function setDefaultAddress(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new UnauthorizedError();
  const { id } = request.params as { id: string };
  const result = await service.setDefaultAddress(request.user.id, id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}
