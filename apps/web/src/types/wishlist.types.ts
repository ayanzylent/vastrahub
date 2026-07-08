import type { TimestampFields } from './common.types';

/**
 * Wishlist document.
 */
export interface IWishlist extends TimestampFields {
  _id: string;
  userId: string;
  productIds: string[];
}
