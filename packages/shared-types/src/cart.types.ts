import type { TimestampFields } from './common.types.js';

/**
 * Snapshot of product/SKU data at the time the item was added to cart.
 */
export interface ICartItemSnapshot {
  productName: string;
  variantLabel: string;
  imageUrl?: string;
  pricePaise: number;
  mrpPaise: number;
}

/**
 * A single item in the shopping cart.
 */
export interface ICartItem {
  _id: string;
  productId: string;
  skuId: string;
  quantity: number;
  snapshot: ICartItemSnapshot;
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
