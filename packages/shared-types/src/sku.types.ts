import type { TimestampFields } from './common.types.js';

/**
 * SKU (Stock Keeping Unit) document.
 * Note: SKU has NO direct `images` field — media is on the product level.
 * Field names match the Mongoose model (what `.lean()` returns).
 */
export interface ISku extends TimestampFields {
  _id: string;
  productId: string;
  sku: string;
  barcode?: string;
  /** Variant key-value pairs, e.g. { Color: "Red", Size: "L" }. DB field: `attributes` (Map serialized to object). */
  attributes: Record<string, string>;
  pricePaise: number;
  mrpPaise: number;
  costPricePaise?: number;
  /** Available stock. DB field: `stockQuantity`. */
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  isDefault: boolean;
  isActive: boolean;
}
