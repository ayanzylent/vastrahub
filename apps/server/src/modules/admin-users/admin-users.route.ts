/**
 * Admin Users route plugin.
 * Superadmin only: admin listing, promotion, and revocation.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import * as handler from './admin-users.handler.js';
import {
  AdminUserIdParams,
  AdminUserListQuery,
  SearchCustomersQuery,
  PromoteToAdminBody,
} from './admin-users.schema.js';

export default fp(async function adminUsersRoutes(fastify: FastifyInstance) {
  // List admin & superadmin users
  fastify.get('/api/v1/admin/users', {
    preHandler: [authenticate, requireRole('superadmin')],
    schema: {
      querystring: AdminUserListQuery,
      tags: ['Admin - Users'],
      summary: 'List admin & superadmin users',
    },
  }, handler.list);

  // Search customers (for "Add Admin" dialog)
  fastify.get('/api/v1/admin/users/search-customers', {
    preHandler: [authenticate, requireRole('superadmin')],
    schema: {
      querystring: SearchCustomersQuery,
      tags: ['Admin - Users'],
      summary: 'Search customers by email or name',
    },
  }, handler.searchCustomers);

  // Get user by ID
  fastify.get('/api/v1/admin/users/:id', {
    preHandler: [authenticate, requireRole('superadmin')],
    schema: {
      params: AdminUserIdParams,
      tags: ['Admin - Users'],
      summary: 'Get user by ID',
    },
  }, handler.getById);

  // Promote a customer to admin
  fastify.post('/api/v1/admin/users/promote', {
    preHandler: [authenticate, requireRole('superadmin')],
    schema: {
      body: PromoteToAdminBody,
      tags: ['Admin - Users'],
      summary: 'Promote a customer to admin',
    },
  }, handler.promoteToAdmin);

  // Revoke admin access (demote to customer)
  fastify.put('/api/v1/admin/users/:id/revoke', {
    preHandler: [authenticate, requireRole('superadmin')],
    schema: {
      params: AdminUserIdParams,
      tags: ['Admin - Users'],
      summary: 'Revoke admin access',
    },
  }, handler.revokeAdmin);
});
