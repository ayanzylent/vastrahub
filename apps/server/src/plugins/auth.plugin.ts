/**
 * Better-Auth integration plugin for Fastify.
 * Configures email/password auth with cookie-based sessions.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import mongoose from 'mongoose';
import { getConfig } from '../config/env.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _auth: any = null;

/**
 * Get the Better-Auth instance (initialized by the plugin).
 */
export function getAuth() {
  if (!_auth) {
    throw new Error('Auth not initialized. Register the auth plugin first.');
  }
  return _auth;
}

export default fp(
  async function authPlugin(fastify: FastifyInstance) {
    const config = getConfig();

    const db = mongoose.connection.getClient().db();
    if (!db) {
      throw new Error('MongoDB not connected. Register mongoose plugin before auth plugin.');
    }

    _auth = betterAuth({
      database: mongodbAdapter(db),
      secret: config.BETTER_AUTH_SECRET,
      baseURL: config.BETTER_AUTH_URL,
      trustedOrigins: config.BETTER_AUTH_TRUSTED_ORIGINS.split(',').map((o) => o.trim()),
      emailAndPassword: {
        enabled: true,
      },
      session: {
        cookieCache: {
          enabled: true,
          maxAge: 5 * 60, // 5 minutes cache
        },
      },
      user: {
        additionalFields: {
          role: {
            type: 'string',
            defaultValue: 'customer',
            required: false,
          },
        },
      },
    });

    // Mount Better-Auth handler at /api/auth/*
    fastify.all('/api/auth/*', async (request: FastifyRequest, reply: FastifyReply) => {
      // Convert Fastify request/reply to Web Request/Response
      const url = new URL(request.url, config.BETTER_AUTH_URL);
      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach((v) => headers.append(key, v));
          } else {
            headers.set(key, value);
          }
        }
      }

      const webRequest = new Request(url.toString(), {
        method: request.method,
        headers,
        body: request.method !== 'GET' && request.method !== 'HEAD'
          ? JSON.stringify(request.body)
          : undefined,
      });

      const response = await _auth!.handler(webRequest) as Response;

      // Copy response headers
      response.headers.forEach((value: string, key: string) => {
        void reply.header(key, value);
      });

      return reply.status(response.status).send(
        response.headers.get('content-type')?.includes('application/json')
          ? await response.json()
          : await response.text(),
      );
    });
  },
  { name: 'auth-plugin', dependencies: ['mongoose-plugin'] },
);
