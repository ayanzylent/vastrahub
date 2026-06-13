/**
 * MongoDB connection management with retry logic.
 */

import mongoose from 'mongoose';
import type { EnvConfig } from './env.js';
import dns from "node:dns/promises";

//to prevent nodejs v24 error for MongoDB connection
process.env.NODE_ENV !== 'production' && dns.setServers(["1.1.1.1"]);

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Connect to MongoDB with exponential backoff retry logic.
 */
export async function connectDatabase(config: EnvConfig): Promise<typeof mongoose> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const conn = await mongoose.connect(config.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      lastError = err as Error;
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.error(
        `❌ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${lastError.message}`,
      );

      if (attempt < MAX_RETRIES) {
        console.log(`   Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

/**
 * Register mongoose connection event handlers.
 */
export function setupConnectionEvents(): void {
  mongoose.connection.on('connected', () => {
    console.log('📦 Mongoose connection established');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  Mongoose disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err.message);
  });
}

/**
 * Gracefully disconnect from MongoDB.
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('📦 MongoDB disconnected gracefully');
  } catch (err) {
    console.error('❌ Error disconnecting MongoDB:', (err as Error).message);
  }
}
