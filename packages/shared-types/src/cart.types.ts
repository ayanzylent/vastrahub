import type { TimestampFields } from './common.types.js';

/**
 * A single item in the shopping cart.
 */
export interface ICartItem {
  _id: string;
  productId: string;
  skuId: string;
  quantity: number;

  // Live computed fields (populated dynamically on the fly, not stored in DB)
  productName?: string;
  variantLabel?: string;
  imageUrl?: string;
  pricePaise?: number;
  mrpPaise?: number;
  skuCode?: string;
}

/**
 * Shopping cart document.
 */
export interface ICart extends TimestampFields {
  _id: string;
  userId: string;
  items: ICartItem[];
  totalPaise: number;
}
