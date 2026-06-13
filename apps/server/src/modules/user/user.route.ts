/**
 * User profile route plugin.
 * All routes require authentication.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as handler from './user.handler.js';
import {
  AddressIdParams,
  UpdateProfileBody,
  AddAddressBody,
  UpdateAddressBody,
} from './user.schema.js';

export default fp(async function userRoutes(fastify: FastifyInstance) {
  // Profile
  fastify.get('/api/v1/user/profile', {
    preHandler: [authenticate],
    schema: {
      tags: ['User'],
      summary: 'Get my profile',
    },
  }, handler.getProfile);

  fastify.put('/api/v1/user/profile', {
    preHandler: [authenticate],
    schema: {
      body: UpdateProfileBody,
      tags: ['User'],
      summary: 'Update my profile',
    },
  }, handler.updateProfile);

  // Addresses
  fastify.get('/api/v1/user/addresses', {
    preHandler: [authenticate],
    schema: {
      tags: ['User'],
      summary: 'List my addresses',
    },
  }, handler.listAddresses);

  fastify.post('/api/v1/user/addresses', {
    preHandler: [authenticate],
    schema: {
      body: AddAddressBody,
      tags: ['User'],
      summary: 'Add a new address',
    },
  }, handler.addAddress);

  fastify.put('/api/v1/user/addresses/:id', {
    preHandler: [authenticate],
    schema: {
      params: AddressIdParams,
      body: UpdateAddressBody,
      tags: ['User'],
      summary: 'Update an address',
    },
  }, handler.updateAddress);

  fastify.delete('/api/v1/user/addresses/:id', {
    preHandler: [authenticate],
    schema: {
      params: AddressIdParams,
      tags: ['User'],
      summary: 'Delete an address',
    },
  }, handler.deleteAddress);

  fastify.put('/api/v1/user/addresses/:id/default', {
    preHandler: [authenticate],
    schema: {
      params: AddressIdParams,
      tags: ['User'],
      summary: 'Set address as default',
    },
  }, handler.setDefaultAddress);
});
