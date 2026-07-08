import type { IUser } from './user.types';

/**
 * Login request body.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Signup request body.
 */
export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

/**
 * Authentication response.
 */
export interface AuthResponse {
  user: Omit<IUser, 'addresses'>;
  token: string;
  expiresAt: string;
}
