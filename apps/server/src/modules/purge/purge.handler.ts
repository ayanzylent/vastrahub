/**
 * Purge handler — request handler for the purge endpoint.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { purgeDeletedProducts } from './purge.service.js';

export async function handlePurge(request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as { dryRun?: string; days?: string };
  const dryRun = q.dryRun === 'true';
  const days = q.days ? parseInt(q.days, 10) : undefined;

  const result = await purgeDeletedProducts({
    dryRun,
    retentionDays: days && !isNaN(days) && days > 0 ? days : undefined,
  });

  request.log.info(
    { ...result },
    dryRun
      ? `[PURGE DRY RUN] Would purge ${result.productsDeleted} products`
      : `[PURGE] Purged ${result.productsDeleted} products, ${result.skusDeleted} SKUs`,
  );

  reply.send({ success: true, data: result });
}
