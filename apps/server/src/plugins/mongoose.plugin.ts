/**
 * Mongoose connection plugin for Fastify.
 * Connects to MongoDB and registers all models.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { connectDatabase, setupConnectionEvents } from '../config/database.js';
import { getConfig } from '../config/env.js';

// Import all models to register them with Mongoose
import '../db/models/index.js';

export default fp(
  async function mongoosePlugin(fastify: FastifyInstance) {
    const config = getConfig();

    setupConnectionEvents();
    await connectDatabase(config);

    fastify.addHook('onClose', async () => {
      const { disconnectDatabase } = await import('../config/database.js');
      await disconnectDatabase();
    });
  },
  { name: 'mongoose-plugin' },
);
