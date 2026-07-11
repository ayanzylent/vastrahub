/**
 * Site settings request handlers — thin controllers calling the service layer.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './site-settings.service.js';

// ---------- Admin handlers ----------

export async function getAdmin(_request: FastifyRequest, reply: FastifyReply) {
  const data = await service.getOrCreateSettings();
  return reply.status(200).send({ success: true, data, statusCode: 200 });
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const data = await service.updateSettings(request.body as service.UpdateSettingsInput);
  return reply.status(200).send({ success: true, data, statusCode: 200 });
}

export async function reset(_request: FastifyRequest, reply: FastifyReply) {
  const data = await service.resetSettings();
  return reply.status(200).send({ success: true, data, statusCode: 200 });
}

// ---------- Storefront handlers ----------

export async function getStorefront(_request: FastifyRequest, reply: FastifyReply) {
  const data = await service.getHydratedStorefrontSettings();
  return reply.status(200).send({ success: true, data, statusCode: 200 });
}

export async function getStorefrontHero(_request: FastifyRequest, reply: FastifyReply) {
  const data = await service.getHero();
  return reply.status(200).send({ success: true, data, statusCode: 200 });
}

export async function getStorefrontAnnouncement(_request: FastifyRequest, reply: FastifyReply) {
  const data = await service.getAnnouncementBar();
  return reply.status(200).send({ success: true, data, statusCode: 200 });
}

export async function getStorefrontProductPage(_request: FastifyRequest, reply: FastifyReply) {
  const data = await service.getProductPageSettings();
  return reply.status(200).send({ success: true, data, statusCode: 200 });
}
