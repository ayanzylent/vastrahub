/**
 * Product request handlers — thin controllers calling service layer.
 * Note: Request data is validated by TypeBox schemas on the route layer.
 * The `as` assertions here are safe because data is guaranteed valid by the time it reaches handlers.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './product.service.js';
import { APP_CONFIG } from '../../constants/index.js';

// ---------- Admin handlers ----------

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const data = request.body as service.CreateProductInput;
  const result = await service.createProduct(data);
  return reply.status(201).send({ success: true, data: result, statusCode: 201 });
}

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as {
    page?: string; limit?: string; categoryId?: string;
    categorySlug?: string; status?: string; search?: string;
  };
  const page = Math.max(1, parseInt(q.page ?? '1', 10) || 1);
  const limit = Math.min(
    APP_CONFIG.MAX_PAGE_SIZE,
    Math.max(1, parseInt(q.limit ?? String(APP_CONFIG.DEFAULT_PAGE_SIZE), 10) || APP_CONFIG.DEFAULT_PAGE_SIZE),
  );

  const result = await service.listProducts({
    page,
    limit,
    categoryId: q.categoryId,
    categorySlug: q.categorySlug,
    status: q.status,
    search: q.search,
  });
  return reply.status(200).send({ success: true, ...result, statusCode: 200 });
}

export async function getById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await service.getProductByIdWithSkus(id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = request.body as service.UpdateProductInput;
  const userId = request.user?.id;
  const result = await service.updateProduct(id, data, userId);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  await service.deleteProduct(id);
  return reply.status(200).send({ success: true, data: { deleted: true }, statusCode: 200 });
}

export async function publish(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await service.publishProduct(id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function unpublish(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await service.unpublishProduct(id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function setSlug(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { slug } = request.body as { slug: string };
  const userId = request.user?.id;
  const result = await service.setManualSlug(id, slug, userId);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function autoSlug(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const userId = request.user?.id;
  const result = await service.regenerateSlug(id, userId);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function slugHistory(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await service.getSlugHistory(id);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function removeSlugHistory(request: FastifyRequest, reply: FastifyReply) {
  const { id, oldSlug } = request.params as { id: string; oldSlug: string };
  const result = await service.removeSlugHistoryEntry(id, oldSlug);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

// ---------- Storefront handlers ----------

export async function storefrontList(request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as {
    page?: string; limit?: string; categoryId?: string; categorySlug?: string;
    minPricePaise?: string; maxPricePaise?: string; brands?: string; tags?: string;
    inStock?: string; search?: string; sortBy?: string;
  };
  const page = Math.max(1, parseInt(q.page ?? '1', 10) || 1);
  const limit = Math.min(
    APP_CONFIG.MAX_PAGE_SIZE,
    Math.max(1, parseInt(q.limit ?? String(APP_CONFIG.DEFAULT_PAGE_SIZE), 10) || APP_CONFIG.DEFAULT_PAGE_SIZE),
  );

  const result = await service.listStorefrontProducts({
    page,
    limit,
    categoryId: q.categoryId,
    categorySlug: q.categorySlug,
    minPricePaise: q.minPricePaise ? parseInt(q.minPricePaise, 10) : undefined,
    maxPricePaise: q.maxPricePaise ? parseInt(q.maxPricePaise, 10) : undefined,
    brands: q.brands ? q.brands.split(',') : undefined,
    tags: q.tags ? q.tags.split(',') : undefined,
    inStock: q.inStock === 'true' ? true : undefined,
    search: q.search,
    sortBy: q.sortBy as service.StorefrontListOpts['sortBy'],
  });
  return reply.status(200).send({ success: true, ...result, statusCode: 200 });
}

export async function getBySlug(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = request.params as { slug: string };
  const result = await service.getProductBySlug(slug);

  if (result.redirect) {
    return reply.status(200).send({
      success: true,
      data: result.product,
      redirect: true,
      newSlug: result.newSlug,
      statusCode: 200,
    });
  }

  return reply.status(200).send({ success: true, data: result.product, statusCode: 200 });
}

export async function featured(request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as { limit?: string };
  const limit = Math.min(50, parseInt(q.limit ?? '10', 10) || 10);
  const result = await service.getFeaturedProducts(limit);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}
