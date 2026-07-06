/**
 * Site settings route plugin.
 * Admin: read / full-replace update / reset the singleton settings.
 * Storefront: read the hydrated homepage settings (public).
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import * as handler from './site-settings.handler.js';
import { UpdateSiteSettingsBody } from './site-settings.schema.js';

export default fp(async function siteSettingsRoutes(fastify: FastifyInstance) {
  // ---------- Admin routes ----------
  fastify.get('/api/v1/admin/site-settings', {
    preHandler: [authenticate, requireRole('superadmin')],
    schema: {
      tags: ['Admin - Settings'],
      summary: 'Get site settings (creates defaults on first access)',
    },
  }, handler.getAdmin);

  fastify.put('/api/v1/admin/site-settings', {
    preHandler: [authenticate, requireRole('superadmin')],
    schema: {
      body: UpdateSiteSettingsBody,
      tags: ['Admin - Settings'],
      summary: 'Replace homepage blocks and announcement bar',
    },
  }, handler.update);

  fastify.post('/api/v1/admin/site-settings/reset', {
    preHandler: [authenticate, requireRole('superadmin')],
    schema: {
      tags: ['Admin - Settings'],
      summary: 'Reset site settings to defaults',
    },
  }, handler.reset);

  // ---------- Storefront routes ----------
  fastify.get('/api/v1/storefront/hero', {
    schema: {
      tags: ['Storefront - Settings'],
      summary: 'Get the singleton hero config (ISR-cached on the storefront)',
    },
  }, handler.getStorefrontHero);

  fastify.get('/api/v1/storefront/site-settings', {
    schema: {
      tags: ['Storefront - Settings'],
      summary: 'Get hydrated homepage blocks for rendering',
    },
  }, handler.getStorefront);

  fastify.get('/api/v1/storefront/announcement', {
    schema: {
      tags: ['Storefront - Settings'],
      summary: 'Get the announcement bar (lightweight, no homepage hydration)',
    },
  }, handler.getStorefrontAnnouncement);
});
