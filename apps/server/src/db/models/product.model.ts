/**
 * Product model — most complex model in the system.
 *
 * CRITICAL DESIGN NOTES:
 * - NO `images` field on Product. All media is in `variantMedia[].media[]`.
 * - variantMedia[].media[] items have type: "image" | "video"
 * - Must have exactly one isCoverGroup=true in variantMedia
 * - gstPercentage must be in [null, 0, 5, 12, 18, 28]
 */

import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import { softDeletePlugin, type SoftDeleteDocument } from '../plugins/soft-delete.plugin.js';

import { GST_SLABS } from '../../constants/index.js';

// ---------- Interfaces ----------

export interface IMediaItem {
  type: 'image' | 'video';
  url: string;
  alt: string;
  sortOrder: number;
  thumbnailUrl?: string | null;
  durationSecs?: number | null;
  mimeType: string;
}

export interface IVariantMedia {
  variantValue: string;
  variantLabel: string;
  variantSlug: string;
  media: IMediaItem[];
  isCoverGroup: boolean;
}

export interface IVariantOptionValue {
  value: string;
  label: string;
  slug: string;
}

export interface IVariantOption {
  name: string;
  type: string;
  values: IVariantOptionValue[];
}

export interface ISlugHistoryEntry {
  slug: string;
  changedAt: Date;
  changedBy: string;
}

export interface IProductDocument extends Document, SoftDeleteDocument {
  name: string;
  slug: string;
  slugHistory: ISlugHistoryEntry[];
  isSlugManual: boolean;
  description: string;
  shortDescription?: string;
  categoryId: Types.ObjectId;
  brand?: string;
  tags: string[];
  styleCode?: string;
  variantOptions: IVariantOption[];
  visualAttributeName?: string;
  showVisualSelector: boolean;
  variantMedia: IVariantMedia[];
  basePricePaise: number;
  baseMrpPaise: number;
  minPricePaise: number;
  maxPricePaise: number;
  minMrpPaise: number;
  maxMrpPaise: number;
  metadata: {
    metaTitle?: string;
    metaDescription?: string;
  };
  material?: string;
  careInstructions?: string;
  originCountry?: string;
  hsn?: string;
  gstPercentage: number | null;
  isActive: boolean;
  isFeatured: boolean;
  publishedAt: Date | null;
  skuCount: number;
  reviewCount: number;
  averageRating: number;
  totalStock: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------- Sub-schemas ----------

const mediaItemSchema = new Schema<IMediaItem>(
  {
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    url: { type: String, required: true },
    alt: { type: String, required: true, default: '' },
    sortOrder: { type: Number, default: 0 },
    thumbnailUrl: { type: String, default: null },
    durationSecs: { type: Number, default: null },
    mimeType: { type: String, required: true },
  },
  { _id: false },
);

const variantMediaSchema = new Schema<IVariantMedia>(
  {
    variantValue: { type: String, required: true },
    variantLabel: { type: String, required: true },
    variantSlug: { type: String, required: true },
    media: { type: [mediaItemSchema], default: [] },
    isCoverGroup: { type: Boolean, default: false },
  },
  { _id: false },
);

const variantOptionValueSchema = new Schema<IVariantOptionValue>(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
    slug: { type: String, required: true },
  },
  { _id: false },
);

const variantOptionSchema = new Schema<IVariantOption>(
  {
    name: { type: String, required: true },
    type: { type: String, default: 'select' },
    values: { type: [variantOptionValueSchema], default: [] },
  },
  { _id: false },
);

const slugHistorySchema = new Schema<ISlugHistoryEntry>(
  {
    slug: { type: String, required: true },
    changedAt: { type: Date, required: true },
    changedBy: { type: String, required: true },
  },
  { _id: false },
);

// ---------- Main schema ----------

const productSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    slugHistory: {
      type: [slugHistorySchema],
      default: [],
    },
    isSlugManual: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: 5000,
    },
    shortDescription: {
      type: String,
      maxlength: 500,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    styleCode: {
      type: String,
      trim: true,
      index: true,
    },
    variantOptions: {
      type: [variantOptionSchema],
      default: [],
    },
    visualAttributeName: {
      type: String,
    },
    showVisualSelector: {
      type: Boolean,
      default: true,
    },
    variantMedia: {
      type: [variantMediaSchema],
      default: [],
    },
    basePricePaise: {
      type: Number,
      default: 0,
      min: [0, 'Base price must be non-negative'],
    },
    baseMrpPaise: {
      type: Number,
      default: 0,
      min: [0, 'Base MRP must be non-negative'],
    },
    minPricePaise: {
      type: Number,
      default: 0,
      min: [0, 'Min price must be non-negative'],
    },
    maxPricePaise: {
      type: Number,
      default: 0,
      min: [0, 'Max price must be non-negative'],
    },
    minMrpPaise: {
      type: Number,
      default: 0,
      min: [0, 'Min MRP must be non-negative'],
    },
    maxMrpPaise: {
      type: Number,
      default: 0,
      min: [0, 'Max MRP must be non-negative'],
    },
    metadata: {
      metaTitle: { type: String, maxlength: 120 },
      metaDescription: { type: String, maxlength: 320 },
    },
    material: { type: String, maxlength: 200 },
    careInstructions: { type: String, maxlength: 1000 },
    originCountry: { type: String, default: 'India' },
    hsn: { type: String },
    gstPercentage: {
      type: Number,
      default: null,
      validate: {
        validator: function (v: number | null): boolean {
          if (v === null || v === undefined) return true;
          return (GST_SLABS as readonly number[]).includes(v);
        },
        message: 'GST percentage must be one of: 0, 5, 12, 18, 28',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    skuCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalStock: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'products',
    optimisticConcurrency: true,
  },
);

// ---------- Indexes ----------

productSchema.index({ 'slugHistory.slug': 1 });
productSchema.index({ categoryId: 1, isActive: 1, deletedAt: 1 });
productSchema.index({ isActive: 1, isFeatured: 1, deletedAt: 1 });
productSchema.index({ basePricePaise: 1 });
productSchema.index({ minPricePaise: 1 });
productSchema.index({ createdAt: 1 });
productSchema.index({ averageRating: -1, reviewCount: -1 });
productSchema.index({ isActive: 1, publishedAt: 1, deletedAt: 1 });

// ---------- Plugins ----------

productSchema.plugin(softDeletePlugin);


// ---------- Export ----------

export const Product: Model<IProductDocument> = mongoose.models.Product
  || mongoose.model<IProductDocument>('Product', productSchema);
