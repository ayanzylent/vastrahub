/**
 * User module TypeBox schemas.
 * Request validation for user profile and address routes.
 */

import { Type, type Static } from '@sinclair/typebox';
import { ObjectId, IdParams } from '../../schemas/common.schema.js';

// ---------- Params ----------

export const AddressIdParams = IdParams;
export type AddressIdParamsType = Static<typeof AddressIdParams>;

// ---------- Body schemas ----------

export const UpdateProfileBody = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  phone: Type.Optional(Type.String()),
});
export type UpdateProfileBodyType = Static<typeof UpdateProfileBody>;

export const AddAddressBody = Type.Object({
  label: Type.String({ minLength: 1 }),
  fullName: Type.String({ minLength: 1 }),
  phone: Type.String({ minLength: 1 }),
  addressLine1: Type.String({ minLength: 1 }),
  addressLine2: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  city: Type.String({ minLength: 1 }),
  state: Type.String({ minLength: 1 }),
  pincode: Type.String({ pattern: '^[0-9]{6}$', description: '6-digit Indian pincode' }),
  isDefault: Type.Optional(Type.Boolean()),
});
export type AddAddressBodyType = Static<typeof AddAddressBody>;

export const UpdateAddressBody = Type.Partial(AddAddressBody);
export type UpdateAddressBodyType = Static<typeof UpdateAddressBody>;
