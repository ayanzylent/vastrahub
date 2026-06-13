/**
 * Fastify app factory.
 * Creates and configures the Fastify instance with all plugins and routes.
 */

import Fastify, { type FastifyInstance } from 'fastify';
import { TypeBoxValidatorCompiler } from '@fastify/type-provider-typebox';
import cookie from '@fastify/cookie';
import formbody from '@fastify/formbody';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { getLoggerConfig } from './plugins/logger.plugin.js';
import corsPlugin from './plugins/cors.plugin.js';
import helmetPlugin from './plugins/helmet.plugin.js';
import errorHandlerPlugin from './plugins/error-handler.plugin.js';
import mongoosePlugin from './plugins/mongoose.plugin.js';
import authPlugin from './plugins/auth.plugin.js';
import { registerRoutes } from './modules/_index.js';
import envPlugin from './config/env.js';

export async function buildApp(): Promise<FastifyInstance> {
  // Create Fastify instance with logger and TypeBox validation
  // Note: NODE_ENV is read from process.env here since env plugin hasn't loaded yet
  const app = Fastify({
    logger: getLoggerConfig(
      (process.env.NODE_ENV as 'development' | 'production' | 'test') ?? 'development',
    ),
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
    trustProxy: true,
  });

  // Set TypeBox as the validator compiler (compiles TypeBox schemas to Ajv validators)
  app.setValidatorCompiler(TypeBoxValidatorCompiler);

  // Register plugins in correct order:

  // 0. Environment — loads .env and validates config (must be first)
  await app.register(envPlugin);

  // 1. Error handler (should be early to catch all errors)
  await app.register(errorHandlerPlugin);

  // 2. Security & parsing
  await app.register(helmetPlugin);
  await app.register(corsPlugin);
  await app.register(cookie);
  await app.register(formbody);

  // 3. OpenAPI docs (schemas auto-generate from TypeBox definitions on routes)
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'VastraHub API',
        description: 'VastraHub E-Commerce API documentation',
        version: '1.0.0',
      },
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Storefront - Products', description: 'Public product browsing' },
        { name: 'Storefront - Categories', description: 'Public category browsing' },
        { name: 'Storefront - Reviews', description: 'Public product reviews' },
        { name: 'Storefront - Coupons', description: 'Coupon validation' },
        { name: 'Cart', description: 'Shopping cart management' },
        { name: 'Wishlist', description: 'User wishlist' },
        { name: 'Checkout', description: 'Checkout and order creation' },
        { name: 'Payment', description: 'Payment processing' },
        { name: 'Orders', description: 'Customer order management' },
        { name: 'User', description: 'User profile and addresses' },
        { name: 'Reviews', description: 'Customer review management' },
        { name: 'Admin - Products', description: 'Product management (admin)' },
        { name: 'Admin - Categories', description: 'Category management (admin)' },
        { name: 'Admin - SKUs', description: 'SKU management (admin)' },
        { name: 'Admin - Orders', description: 'Order management (admin)' },
        { name: 'Admin - Coupons', description: 'Coupon management (admin)' },
        { name: 'Admin - Reviews', description: 'Review moderation (admin)' },
        { name: 'Admin - Users', description: 'User management (superadmin)' },
        { name: 'Admin - Dashboard', description: 'Dashboard stats (admin)' },
        { name: 'Admin - Media', description: 'Media upload management (admin)' },
      ],
    },
  });
  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // 4. Database
  await app.register(mongoosePlugin);

  // 6. Auth (depends on mongoose)
  await app.register(authPlugin);

  // 7. Routes
  await registerRoutes(app);

  return app;
}
