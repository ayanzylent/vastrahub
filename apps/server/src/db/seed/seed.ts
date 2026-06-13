import dns from 'node:dns';
// to prevent nodejs error for MongoDB connection
process.env.NODE_ENV !== 'production' && dns.setServers(['1.1.1.1']);

import mongoose from 'mongoose';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';

if (!process.env.MONGODB_URI || !process.env.BETTER_AUTH_SECRET) {
  throw new Error('MONGODB_URI or BETTER_AUTH_SECRET missing')
}
const MONGODB_URI = process.env.MONGODB_URI

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
        },
      },
    },
  });

  try {
    // ===== SUPERADMIN USER =====
    console.log('\n👤 Seeding superadmin user...');
    const usersCollection = mongoose.connection.collection('users');

    const superadminEmail = 'superadmin@vastrahub.com';
    const existingSuperadmin = await usersCollection.findOne({ email: superadminEmail });

    if (!existingSuperadmin) {
      await auth.api.signUpEmail({
        body: {
          email: superadminEmail,
          password: 'SuperAdmin@123',
          name: 'Super Admin',
          role: 'superadmin',
        },
      });

      console.log('  ✅ Created superadmin: superadmin@vastrahub.com / SuperAdmin@123');
    } else {
      console.log('  ⏭️  Exists: superadmin@vastrahub.com');
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
