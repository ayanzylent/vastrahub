/**
 * Admin Users Service.
 * Manages user listing and role updates for superadmin.
 */

import mongoose from 'mongoose';
import { NotFoundError, ValidationError, ForbiddenError } from '../../lib/errors.js';

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
  return mongoose.connection.collection('users');
}

export async function listUsers(
  page: number = 1,
  limit: number = 20,
  search?: string,
): Promise<{ users: UserRecord[]; total: number; page: number; totalPages: number }> {
  const collection = getUsersCollection();
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (search) {
    const regex = { $regex: search, $options: 'i' };
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    collection
      .find(filter, { projection: { _id: 0, id: 1, name: 1, email: 1, role: 1, emailVerified: 1, image: 1, createdAt: 1, updatedAt: 1 } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray() as unknown as Promise<UserRecord[]>,
    collection.countDocuments(filter),
  ]);

  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getUserById(id: string): Promise<UserRecord> {
  const collection = getUsersCollection();
  const user = await collection.findOne(
    { id },
    { projection: { _id: 0, id: 1, name: 1, email: 1, role: 1, emailVerified: 1, image: 1, createdAt: 1, updatedAt: 1 } },
  ) as UserRecord | null;

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

export async function updateUserRole(
  id: string,
  newRole: string,
): Promise<UserRecord> {
  if (newRole !== 'admin' && newRole !== 'customer') {
    throw new ValidationError('Role must be "admin" or "customer"');
  }

  const collection = getUsersCollection();
  const user = await collection.findOne({ id }) as UserRecord | null;

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.role === 'superadmin') {
    throw new ForbiddenError('Cannot change a superadmin\'s role');
  }

  await collection.updateOne({ id }, { $set: { role: newRole, updatedAt: new Date() } });

  return { ...user, role: newRole, updatedAt: new Date() };
}
