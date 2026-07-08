import type { TimestampFields } from './common.types.js';

/**
 * Wishlist document.
 */
export interface IWishlist extends TimestampFields {
  _id: string;
  userId: string;
  productIds: string[];
}
