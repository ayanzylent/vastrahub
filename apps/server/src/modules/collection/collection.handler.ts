/**
 * Collection request handlers — thin controllers calling the service layer.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './collection.service.js';
import { APP_CONFIG } from '../../constants/index.js';

// ---------- Query parsing helpers ----------

function parsePage(raw?: string): number {
  return Math.max(1, parseInt(raw ?? '1', 10) || 1);
}

function parseLimit(raw?: string, fallback: number = APP_CONFIG.DEFAULT_PAGE_SIZE): number {
  return Math.min(APP_CONFIG.MAX_PAGE_SIZE, Math.max(1, parseInt(raw ?? String(fallback), 10) || fallback));
}

function parseNumber(raw?: string): number | undefined {
  if (raw === undefined || raw === '') return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : n;
}

type ProductQuery = {
  page?: string;
  limit?: string;
  minPricePaise?: string;
  maxPricePaise?: string;
  inStock?: string;
  search?: string;
  sortBy?: service.StorefrontProductOpts['sortBy'];
};

function parseProductOpts(q: ProductQuery, defaultLimit?: number): service.StorefrontProductOpts {
  return {
    page: parsePage(q.page),
    limit: parseLimit(q.limit, defaultLimit),
    minPricePaise: parseNumber(q.minPricePaise),
    maxPricePaise: parseNumber(q.maxPricePaise),
    inStock: q.inStock === 'true',
    search: q.search,
    sortBy: q.sortBy,
  };
}

// ---------- Admin handlers ----------

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const data = request.body as service.CreateCollectionInput;
  const result = await service.createCollection(data);
  return reply.status(201).send({ success: true, data: result, statusCode: 201 });
}

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as { page?: string; limit?: string; search?: string };
  const result = await service.listCollections({
    page: parsePage(q.page),
    limit: parseLimit(q.limit),
    search: q.search,
  });
  return reply.status(200).send({ success: true, ...result, statusCode: 200 });
}

export async function getById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await service.getCollectionById(id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = request.body as service.UpdateCollectionInput;
  const result = await service.updateCollection(id, data);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  await service.deleteCollection(id);
  return reply.status(200).send({ success: true, data: { deleted: true }, statusCode: 200 });
}

export async function preview(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const opts = parseProductOpts(request.query as ProductQuery, APP_CONFIG.MAX_PAGE_SIZE);
  const result = await service.previewCollectionProducts(id, opts);
  return reply.status(200).send({ success: true, ...result, statusCode: 200 });
}

export async function previewDraft(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as service.CollectionDraft & {
    page?: number;
    limit?: number;
  };
  const opts: service.StorefrontProductOpts = {
    page: Math.max(1, Number(body.page) || 1),
    limit: parseLimit(body.limit !== undefined ? String(body.limit) : undefined, APP_CONFIG.MAX_PAGE_SIZE),
  };
  const result = await service.previewCollectionDraft(body, opts);
  return reply.status(200).send({ success: true, ...result, statusCode: 200 });
}

// ---------- Storefront handlers ----------

export async function storefrontList(request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as { featured?: string; limit?: string };
  const result = await service.listStorefrontCollections({
    featured: q.featured === 'true',
    limit: parseNumber(q.limit),
  });
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function storefrontBySlug(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = request.params as { slug: string };
  const opts = parseProductOpts(request.query as ProductQuery, 12);
  const result = await service.getCollectionBySlugWithProducts(slug, opts);
  return reply.status(200).send({
    success: true,
    data: result.collection,
    products: result.products,
    pagination: result.pagination,
    statusCode: 200,
  });
}
