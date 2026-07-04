/**
 * Collection model.
 * A merchandising grouping of products, distinct from the category taxonomy.
 * Two curation modes:
 *  - manual: admin hand-picks products (ordered `productIds`)
 *  - automated: products auto-join by matching `rules` (combined via `matchMode`)
 * Hard-deleted (like Category) — deleting a collection never touches products.
 */

import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

// ---------- Interfaces ----------

export type CollectionType = 'manual' | 'automated';
export type CollectionMatchMode = 'all' | 'any';
export type CollectionRuleField =
  | 'tag'
  | 'price'
  | 'category'
  | 'rating'
  | 'featured'
  | 'newerThanDays';
export type CollectionRuleOperator = 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte';

export interface ICollectionRule {
  field: CollectionRuleField;
  operator: CollectionRuleOperator;
  value: string | number | boolean;
}

export interface ICollectionDocument extends Document {
  name: string;
  slug: string;
  type: CollectionType;
  description?: string;
  image?: string;
  bannerImage?: string;
  productIds: Types.ObjectId[];
  rules: ICollectionRule[];
  matchMode: CollectionMatchMode;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  productCount: number;
  metadata: {
    metaTitle?: string;
    metaDescription?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ---------- Sub-schemas ----------

const collectionRuleSchema = new Schema<ICollectionRule>(
  {
    field: {
      type: String,
      required: true,
      enum: ['tag', 'price', 'category', 'rating', 'featured', 'newerThanDays'],
    },
    operator: {
      type: String,
      required: true,
      enum: ['eq', 'ne', 'lt', 'lte', 'gt', 'gte'],
    },
    // Mixed: value semantics depend on the field (string | number | boolean).
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false },
);

// ---------- Schema ----------

const collectionSchema = new Schema<ICollectionDocument>(
  {
    name: {
      type: String,
      required: [true, 'Collection name is required'],
      trim: true,
      minlength: [2, 'Collection name must be at least 2 characters'],
      maxlength: [120, 'Collection name cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['manual', 'automated'],
      default: 'manual',
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    image: {
      type: String,
    },
    bannerImage: {
      type: String,
    },
    productIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
      default: [],
    },
    rules: {
      type: [collectionRuleSchema],
      default: [],
    },
    matchMode: {
      type: String,
      enum: ['all', 'any'],
      default: 'all',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    productCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    metadata: {
      metaTitle: { type: String, maxlength: 120 },
      metaDescription: { type: String, maxlength: 320 },
    },
  },
  {
    timestamps: true,
    collection: 'collections',
  },
);

// ---------- Indexes ----------

collectionSchema.index({ isActive: 1, isFeatured: 1, sortOrder: 1 });
collectionSchema.index({ productIds: 1 });

// ---------- Export ----------

export const Collection: Model<ICollectionDocument> = mongoose.models.Collection
  || mongoose.model<ICollectionDocument>('Collection', collectionSchema);
