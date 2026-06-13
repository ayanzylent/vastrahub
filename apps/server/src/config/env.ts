/**
 * Environment configuration using @fastify/env + TypeBox.
 *
 * - TypeBox schema defines the shape, defaults, and required env vars.
 * - `Static<typeof EnvSchema>` auto-derives the TypeScript type.
 * - @fastify/env validates + loads .env at plugin registration time.
 * - Config is decorated onto the Fastify instance as `fastify.config`.
 * - A module-level cache (`_config`) is also populated so non-Fastify
 *   code (services, middleware, libs) can call `getConfig()`.
 */

import fp from 'fastify-plugin';
import fastifyEnv from '@fastify/env';
import type { FastifyInstance } from 'fastify';
import { Type, type Static } from '@sinclair/typebox';

// ─── TypeBox schema ──────────────────────────────────────────────────
const EnvSchema = Type.Object({
  // Database
  MONGODB_URI: Type.String(),

  // Auth
  BETTER_AUTH_SECRET: Type.String(),
  BETTER_AUTH_URL: Type.String(),
  BETTER_AUTH_TRUSTED_ORIGINS: Type.String(),

  // Cloudflare R2
  R2_ACCOUNT_ENDPOINT: Type.String(),
  R2_ACCESS_KEY_ID: Type.String(),
  R2_SECRET_ACCESS_KEY: Type.String(),
  R2_REGION: Type.String(),
  R2_BUCKET_NAME: Type.String(),
  R2_PUBLIC_URL: Type.String(),

  // Payment — Razorpay (optional)
  RAZORPAY_KEY_ID: Type.Optional(Type.String({ default: '' })),
  RAZORPAY_KEY_SECRET: Type.Optional(Type.String({ default: '' })),
  RAZORPAY_WEBHOOK_SECRET: Type.Optional(Type.String({ default: '' })),

  // App
  PORT: Type.Integer({ default: 3001 }),
  NODE_ENV: Type.Union(
    [Type.Literal('development'), Type.Literal('production'), Type.Literal('test')],
    { default: 'development' },
  ),
  FRONTEND_URL: Type.String(),
});

// ─── Derived TypeScript type ─────────────────────────────────────────
export type EnvConfig = Static<typeof EnvSchema>;

// ─── Fastify plugin ──────────────────────────────────────────────────
export default fp(
  async function envPlugin(fastify: FastifyInstance) {
    await fastify.register(fastifyEnv, {
      confKey: 'config',
      schema: EnvSchema,
      dotenv: true, // reads .env file automatically
    });

    // Populate module-level cache so getConfig() works for non-Fastify code
    _config = fastify.config;
  },
  { name: 'env-plugin' },
);

// ─── Module-level cache for getConfig() ──────────────────────────────
let _config: EnvConfig | null = null;

/**
 * Get the validated config.
 * Only available after the env plugin has been registered.
 */
export function getConfig(): EnvConfig {
  if (!_config) {
    throw new Error(
      'Config not loaded. Ensure the env plugin is registered before accessing config.',
    );
  }
  return _config;
}

// ─── Fastify type augmentation ───────────────────────────────────────
declare module 'fastify' {
  interface FastifyInstance {
    config: EnvConfig;
  }
}
