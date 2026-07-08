/**
 * Category model.
 * Hierarchical categories with materialized path ancestry.
 * Max depth: 4 levels.
 */

import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

import { APP_CONFIG } from '../../constants/index.js';


// ---------- Interfaces ----------

export interface ICategoryAncestor {
  _id: Types.ObjectId;
  name: string;
  slug: string;
}

export interface ICategoryDocument extends Document {
  name: string;
  slug: string;
  parentId: Types.ObjectId | null;
  ancestors: ICategoryAncestor[];
  level: number;
  description?: string;
  image?: string;
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

// ---------- Schema ----------

const categoryAncestorSchema = new Schema<ICategoryAncestor>(
  {
    _id: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
  },
  { _id: false },
);

const categorySchema = new Schema<ICategoryDocument>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    ancestors: {
      type: [categoryAncestorSchema],
      default: [],
    },
    level: {
      type: Number,
      default: 0,
      min: 0,
      max: APP_CONFIG.MAX_CATEGORY_DEPTH - 1,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    image: {
      type: String,
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
    collection: 'categories',
  },
);

// ---------- Indexes ---------- 

categorySchema.index({ parentId: 1, sortOrder: 1 });
categorySchema.index({ 'ancestors._id': 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ isActive: 1, isFeatured: 1, sortOrder: 1 });



// ---------- Export ----------

export const Category: Model<ICategoryDocument> = mongoose.models.Category
  || mongoose.model<ICategoryDocument>('Category', categorySchema);
