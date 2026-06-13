/**
 * Media request handlers — admin only.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './media.service.js';
import type { InitiateUploadInput } from './media.service.js';

export async function uploadUrl(request: FastifyRequest, reply: FastifyReply) {
  const data = request.body as InitiateUploadInput;
  const result = await service.initiateUpload(data);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function deleteMedia(request: FastifyRequest, reply: FastifyReply) {
  const params = request.params as { '*': string };
  const key = params['*'];
  const result = await service.deleteMedia(key);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}
