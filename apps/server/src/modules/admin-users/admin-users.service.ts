/**
 * Admin Users Service.
 * Manages admin listing, promotion, and role revocation for superadmin.
 *
 * NOTE: Better-auth's MongoDB adapter stores users with native `_id` (ObjectId)
 * and converts `_id` → `id` only in its API responses (e.g. getSession()).
 * The raw collection does NOT have a separate `id` field, so we query by `_id`
 * and map it to `id` (string) in the returned UserRecord.
 */

import mongoose from 'mongoose';
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from '../../lib/errors.js';

const { ObjectId } = mongoose.Types;

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function getUsersCollection() {
  return mongoose.connection.collection('user');
}

function getSessionsCollection() {
  return mongoose.connection.collection('session');
}

/** Map a raw MongoDB user document to a UserRecord. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toUserRecord(doc: any): UserRecord {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role ?? 'customer',
    emailVerified: doc.emailVerified ?? false,
    image: doc.image ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * List admin & superadmin users with pagination and search.
 * Only returns users with role 'admin' or 'superadmin'.
 */
export async function listAdmins(
  page: number = 1,
  limit: number = 20,
  search?: string,
): Promise<{ users: UserRecord[]; total: number; page: number; totalPages: number }> {
  const collection = getUsersCollection();
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {
    role: { $in: ['admin', 'superadmin'] },
  };

  if (search) {
    const regex = { $regex: search, $options: 'i' };
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [docs, total] = await Promise.all([
    collection
      .find(filter, { projection: { name: 1, email: 1, role: 1, emailVerified: 1, image: 1, createdAt: 1, updatedAt: 1 } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  return {
    users: docs.map(toUserRecord),
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Get a single user by ID.
 */
export async function getUserById(id: string): Promise<UserRecord> {
  if (!ObjectId.isValid(id)) {
    throw new NotFoundError('User not found');
  }

  const collection = getUsersCollection();
  const doc = await collection.findOne(
    { _id: new ObjectId(id) },
    { projection: { name: 1, email: 1, role: 1, emailVerified: 1, image: 1, createdAt: 1, updatedAt: 1 } },
  );

  if (!doc) {
    throw new NotFoundError('User not found');
  }

  return toUserRecord(doc);
}

/**
 * Search customers by email or name (for the "Add Admin" dialog).
 * Only returns users with role 'customer' (or null/missing role).
 */
export async function searchCustomers(
  search: string,
  limit: number = 10,
): Promise<UserRecord[]> {
  const collection = getUsersCollection();

  const regex = { $regex: search, $options: 'i' };
  const filter = {
    $and: [
      { $or: [{ role: 'customer' }, { role: { $exists: false } }, { role: null }] },
      { $or: [{ name: regex }, { email: regex }] },
    ],
  };

  const docs = await collection
    .find(filter, { projection: { name: 1, email: 1, role: 1, emailVerified: 1, image: 1, createdAt: 1, updatedAt: 1 } })
    .sort({ name: 1 })
    .limit(limit)
    .toArray();

  return docs.map(toUserRecord);
}

/**
 * Promote a customer to admin by email.
 * Validates that the user exists and is currently a customer.
 */
export async function promoteToAdmin(email: string): Promise<UserRecord> {
  const collection = getUsersCollection();

  const doc = await collection.findOne({ email: email.toLowerCase().trim() });

  if (!doc) {
    throw new NotFoundError('No user found with this email');
  }

  if (doc.role === 'admin') {
    throw new ConflictError('User is already an admin');
  }

  if (doc.role === 'superadmin') {
    throw new ForbiddenError('Cannot modify a superadmin');
  }

  const now = new Date();
  await collection.updateOne(
    { _id: doc._id },
    { $set: { role: 'admin', updatedAt: now } },
  );

  return toUserRecord({ ...doc, role: 'admin', updatedAt: now });
}

/**
 * Revoke admin access (demote to customer).
 * Also invalidates the user's active sessions so the change takes effect immediately.
 */
export async function revokeAdmin(id: string): Promise<UserRecord> {
  if (!ObjectId.isValid(id)) {
    throw new NotFoundError('User not found');
  }

  const collection = getUsersCollection();
  const objectId = new ObjectId(id);
  const doc = await collection.findOne({ _id: objectId });

  if (!doc) {
    throw new NotFoundError('User not found');
  }

  if (doc.role === 'superadmin') {
    throw new ForbiddenError('Cannot change a superadmin\'s role');
  }

  if (doc.role !== 'admin') {
    throw new ValidationError('User is not an admin');
  }

  const now = new Date();
  await collection.updateOne(
    { _id: objectId },
    { $set: { role: 'customer', updatedAt: now } },
  );

  // Revoke all active sessions so the role change takes effect immediately.
  // The user will need to re-login and will no longer have admin access.
  await getSessionsCollection().deleteMany({ userId: objectId });

  return toUserRecord({ ...doc, role: 'customer', updatedAt: now });
}
