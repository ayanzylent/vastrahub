/**
 * Admin Users route plugin.
 * Superadmin only: user listing and role management.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import * as handler from './admin-users.handler.js';
import {
  AdminUserIdParams,
  AdminUserListQuery,
  UpdateRoleBody,
} from './admin-users.schema.js';

export default fp(async function adminUsersRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/admin/users', {
    preHandler: [authenticate, requireRole('superadmin')],
    schema: {
      querystring: AdminUserListQuery,
      tags: ['Admin - Users'],
      summary: 'List all users',
    },
  }, handler.list);

  fastify.get('/api/v1/admin/users/:id', {
    preHandler: [authenticate, requireRole('superadmin')],
    schema: {
      params: AdminUserIdParams,
      tags: ['Admin - Users'],
      summary: 'Get user by ID',
    },
  }, handler.getById);

  fastify.put('/api/v1/admin/users/:id/role', {
    preHandler: [authenticate, requireRole('superadmin')],
    schema: {
      params: AdminUserIdParams,
      body: UpdateRoleBody,
      tags: ['Admin - Users'],
      summary: 'Update user role',
    },
  }, handler.updateRole);
});
