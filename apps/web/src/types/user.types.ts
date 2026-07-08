import type { TimestampFields } from './common.types';

/**
 * User roles in the platform.
 */
export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

/**
 * User address.
 */
export interface IAddress {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

/**
 * User document.
 */
export interface IUser extends TimestampFields {
  _id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  role: UserRole;
  phone?: string;
  addresses: IAddress[];
  isActive: boolean;
}
