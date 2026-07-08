import type { TimestampFields } from './common.types';

/**
 * Curation model for a collection.
 * - `manual`: admin hand-picks products (ordered via `productIds`).
 * - `automated`: products auto-join by matching `rules`.
 */
export type CollectionType = 'manual' | 'automated';

/**
 * How multiple automated rules combine.
 * - `all`: every rule must match (AND).
 * - `any`: at least one rule must match (OR).
 */
export type CollectionMatchMode = 'all' | 'any';

/**
 * Product attribute an automated rule can match on.
 */
export type CollectionRuleField =
  | 'tag'
  | 'price'
  | 'category'
  | 'rating'
  | 'featured'
  | 'newerThanDays';

/**
 * Comparison operator for an automated rule.
 * Which operators are valid depends on the field (see server rule engine).
 */
export type CollectionRuleOperator = 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte';

/**
 * A single automated-collection condition.
 * `value` semantics depend on `field`:
 * - tag: string (a product tag)
 * - price: number in paise (compared against product minPricePaise)
 * - category: string (category _id)
 * - rating: number 0–5
 * - featured: boolean
 * - newerThanDays: number of days
 */
export interface ICollectionRule {
  field: CollectionRuleField;
  operator: CollectionRuleOperator;
  value: string | number | boolean;
}

/**
 * Collection document — a merchandising grouping of products,
 * distinct from the category taxonomy.
 */
export interface ICollection extends TimestampFields {
  _id: string;
  name: string;
  slug: string;
  type: CollectionType;
  description?: string;
  /** Card/thumbnail image media key. */
  image?: string;
  /** Hero banner image media key. */
  bannerImage?: string;
  /** Ordered product ids — manual collections only. */
  productIds: string[];
  /** Automated matching rules — automated collections only. */
  rules: ICollectionRule[];
  /** How rules combine — automated collections only. */
  matchMode: CollectionMatchMode;
  isActive: boolean;
  /** Feature on the storefront homepage. */
  isFeatured: boolean;
  sortOrder: number;
  /** Cached count of currently-visible products. */
  productCount: number;
  metaTitle?: string;
  metaDescription?: string;
}
