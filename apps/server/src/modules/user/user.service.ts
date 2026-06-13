/**
 * User profile service — manages profile and addresses.
 * Users are managed by Better-Auth; we access the collection directly.
 */

import mongoose from 'mongoose';
import { Address } from '../../db/models/index.js';
import type { IAddressDocument } from '../../db/models/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../../lib/errors.js';
import { isValidIndianState, APP_CONFIG } from '@vastrahub/shared-constants';

// ---------- Interfaces ----------

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
}

export interface AddAddressInput {
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

// ---------- Service functions ----------

/**
 * Get user profile from Better-Auth users collection.
 */
export async function getProfile(userId: string) {
  const user = await mongoose.connection.collection('user').findOne({ id: userId });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role ?? 'customer',
    phone: user.phone ?? null,
    image: user.image ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Update user profile (name, phone).
 */
export async function updateProfile(userId: string, data: UpdateProfileInput) {
  const updateFields: Record<string, unknown> = {};
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.phone !== undefined) updateFields.phone = data.phone;

  if (Object.keys(updateFields).length === 0) {
    throw new ValidationError('No fields to update');
  }

  updateFields.updatedAt = new Date();

  const result = await mongoose.connection.collection('user').findOneAndUpdate(
    { id: userId },
    { $set: updateFields },
    { returnDocument: 'after' },
  );

  if (!result) {
    throw new NotFoundError('User not found');
  }

  return {
    id: result.id,
    name: result.name,
    email: result.email,
    role: result.role ?? 'customer',
    phone: result.phone ?? null,
    image: result.image ?? null,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

/**
 * List addresses for a user.
 */
export async function listAddresses(userId: string) {
  const addresses = await Address.find({ userId })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();
  return addresses;
}

/**
 * Add a new address.
 */
export async function addAddress(userId: string, data: AddAddressInput) {
  // Validate Indian state
  if (!isValidIndianState(data.state)) {
    throw new ValidationError(`Invalid state: "${data.state}". Must be a valid Indian state.`);
  }

  // Validate pincode format (6 digits)
  if (!/^[0-9]{6}$/.test(data.pincode)) {
    throw new ValidationError('Pincode must be 6 digits');
  }

  // Check max addresses
  const count = await Address.countDocuments({ userId });
  if (count >= APP_CONFIG.MAX_ADDRESSES_PER_USER) {
    throw new ValidationError(
      `Maximum ${APP_CONFIG.MAX_ADDRESSES_PER_USER} addresses allowed per user`,
    );
  }

  // If this is default, unset other defaults
  if (data.isDefault) {
    await Address.updateMany({ userId }, { $set: { isDefault: false } });
  }

  // If this is the first address, make it default
  const isFirst = count === 0;

  const address = new Address({
    userId,
    label: data.label,
    fullName: data.fullName,
    phone: data.phone,
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2 ?? undefined,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    isDefault: data.isDefault ?? isFirst,
  });

  await address.save();
  return address.toObject();
}

/**
 * Update an address.
 */
export async function updateAddress(userId: string, addressId: string, data: Partial<AddAddressInput>) {
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    throw new ValidationError('Invalid address ID');
  }

  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) {
    throw new NotFoundError('Address not found');
  }

  // Validate state if provided
  if (data.state && !isValidIndianState(data.state)) {
    throw new ValidationError(`Invalid state: "${data.state}". Must be a valid Indian state.`);
  }

  if (data.pincode && !/^[0-9]{6}$/.test(data.pincode)) {
    throw new ValidationError('Pincode must be 6 digits');
  }

  if (data.label !== undefined) address.label = data.label;
  if (data.fullName !== undefined) address.fullName = data.fullName;
  if (data.phone !== undefined) address.phone = data.phone;
  if (data.addressLine1 !== undefined) address.addressLine1 = data.addressLine1;
  if (data.addressLine2 !== undefined) address.addressLine2 = data.addressLine2 ?? undefined;
  if (data.city !== undefined) address.city = data.city;
  if (data.state !== undefined) address.state = data.state;
  if (data.pincode !== undefined) address.pincode = data.pincode;

  // If setting as default, unset others
  if (data.isDefault) {
    await Address.updateMany({ userId, _id: { $ne: address._id } }, { $set: { isDefault: false } });
    address.isDefault = true;
  }

  await address.save();
  return address.toObject();
}

/**
 * Delete an address.
 */
export async function deleteAddress(userId: string, addressId: string) {
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    throw new ValidationError('Invalid address ID');
  }

  const address = await Address.findOneAndDelete({ _id: addressId, userId });
  if (!address) {
    throw new NotFoundError('Address not found');
  }

  // If this was the default, make the first remaining address default
  if (address.isDefault) {
    const remaining = await Address.findOne({ userId }).sort({ createdAt: 1 });
    if (remaining) {
      remaining.isDefault = true;
      await remaining.save();
    }
  }

  return { deleted: true };
}

/**
 * Set an address as default.
 */
export async function setDefaultAddress(userId: string, addressId: string) {
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    throw new ValidationError('Invalid address ID');
  }

  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) {
    throw new NotFoundError('Address not found');
  }

  // Unset other defaults
  await Address.updateMany({ userId, _id: { $ne: address._id } }, { $set: { isDefault: false } });

  address.isDefault = true;
  await address.save();

  return address.toObject();
}
