/**
 * Authentication middleware for Fastify.
 * Verifies session via Better-Auth and attaches user to request.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { getAuth } from '../plugins/auth.plugin.js';
import { UnauthorizedError, ForbiddenError } from '../lib/errors.js';
import { getConfig } from '../config/env.js';
import { hasMinimumRole, type UserRoleType } from '../constants/index.js';

// Augment Fastify request with user info
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }
}

/**
 * Authenticate the request by verifying the session cookie or Bearer token.
 */
export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  try {
    const auth = getAuth();
    const config = getConfig();

    // Build a Web Request from Fastify request for Better-Auth
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

    const session = await auth.api.getSession({
      headers,
    });

    if (!session?.user) {
      throw new UnauthorizedError('Invalid or expired session');
    }

    request.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: (session.user as unknown as { role?: string }).role ?? 'customer',
    };
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Authentication failed');
  }
}

/**
 * Require specific role(s) — use as a preHandler after authenticate.
 */
export function requireRole(...roles: UserRoleType[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const userRole = request.user.role as UserRoleType;

    // Check if user has any of the required roles, or has a higher role
    const hasAccess = roles.some((requiredRole) =>
      hasMinimumRole(userRole, requiredRole),
    );

    if (!hasAccess) {
      throw new ForbiddenError('Insufficient permissions');
    }
  };
}
