import dns from 'node:dns';
// to prevent nodejs error for MongoDB connection
process.env.NODE_ENV !== 'production' && dns.setServers(['1.1.1.1']);

import mongoose from 'mongoose';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';

if (!process.env.MONGODB_URI || !process.env.BETTER_AUTH_SECRET) {
  throw new Error('MONGODB_URI or BETTER_AUTH_SECRET missing');
}
const MONGODB_URI = process.env.MONGODB_URI;

async function seed(): Promise<void> {
  console.log('🌱 Starting seed...');
  console.log(`📦 Connecting to MongoDB: ${MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@')}`);

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.getClient().db();
  if (!db) {
    throw new Error('MongoDB client/db not found.');
  }

  // Initialize Better Auth for seeding
  const auth = betterAuth({
    database: mongodbAdapter(db),
    secret: process.env.BETTER_AUTH_SECRET || 'secret',
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
    trustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          defaultValue: 'customer',
          required: false,
          input: false, // reject role from client payloads
        },
      },
    },
  });

  try {
    // ===== SUPERADMIN USER =====
    console.log('\n👤 Seeding superadmin user...');

    const superadminEmail = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
    const superadminPassword = process.env.SUPERADMIN_PASSWORD;

    if (!superadminEmail || !superadminPassword) {
      throw new Error(
        'SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD are required to seed the bootstrap account',
      );
    }

    const usersCollection = mongoose.connection.collection('user');
    const existingSuperadmin = await usersCollection.findOne({
      email: superadminEmail,
    });

    if (!existingSuperadmin) {
      // Create without role — input: false blocks role on signUpEmail
      await auth.api.signUpEmail({
        body: {
          email: superadminEmail,
          password: superadminPassword,
          name: 'Super Admin',
        },
      });

      // Privilege assignment must be server-side via direct DB write
      const updated = await usersCollection.findOneAndUpdate(
        { email: superadminEmail },
        { $set: { role: 'superadmin', updatedAt: new Date() } },
        { returnDocument: 'after' },
      );

      if (!updated || updated.role !== 'superadmin') {
        throw new Error(`Failed to assign superadmin role to ${superadminEmail}`);
      }

      console.log(`  ✅ Created superadmin: ${superadminEmail}`);
    } else {
      console.log(`  ⏭️  Exists: ${superadminEmail}`);
    }

    console.log('\n✅ Seed completed successfully!');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
}

seed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
