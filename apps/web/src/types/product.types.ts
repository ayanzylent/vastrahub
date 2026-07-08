import type { TimestampFields } from './common.types';
import type { IVariantMedia } from './media.types';

interface IVariantOptionValue {
  value: string;
  label: string;
  slug: string;
}

/**
 * A variant option definition (e.g., "Color" with values ["Red", "Blue"]).
 */
export interface IVariantOption {
  name: string;
  values: IVariantOptionValue[];
}

interface ISlugHistoryEntry {
  slug: string;
  changedAt: Date;
  changedBy: string;
}

/**
 * Product document.
 * Note: Product has NO direct `images` field — all media is in `variantMedia[].media[]`.
 * Field names match the Mongoose model (what `.lean()` returns).
 */
export interface IProduct extends TimestampFields {
  _id: string;
  name: string;
  slug: string;
  isSlugManual: boolean;
  slugHistory: ISlugHistoryEntry[];
  description: string;
  shortDescription?: string;
  categoryId: string;
  /** DB field: `brand` */
  brand?: string;
  tags: string[];
  styleCode?: string;
  variantOptions: IVariantOption[];
  /** The name of the variant attribute used for visual grouping (e.g., "Color"). */
  visualAttributeName?: string;
  /** Whether to show the visual attribute selector on the storefront product page. Defaults to true. */
  showVisualSelector: boolean;
  variantMedia: IVariantMedia[];
  basePricePaise: number;
  baseMrpPaise: number;
  minPricePaise: number;
  maxPricePaise: number;
  minMrpPaise: number;
  maxMrpPaise: number;
  material?: string;
  careInstructions?: string;
  originCountry?: string;
  /** DB field: `hsn` */
  hsn?: string;
  gstPercentage: number | null;
  isActive: boolean;
  isFeatured: boolean;
  publishedAt: Date | null;
  skuCount: number;
  /** DB field: `averageRating` */
  averageRating: number;
  reviewCount: number;
  totalStock: number;
  metadata?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}
