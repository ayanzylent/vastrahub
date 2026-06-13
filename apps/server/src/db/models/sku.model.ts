/**
 * SKU (Stock Keeping Unit) model.
 *
 * CRITICAL: NO `images` field on SKU. Media is on the product level.
 * Post-save hook updates parent Product's aggregated fields.
 */

import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import { softDeletePlugin, type SoftDeleteDocument } from '../plugins/soft-delete.plugin.js';

// ---------- Interfaces ----------

export interface ISkuDocument extends Document, SoftDeleteDocument {
  productId: Types.ObjectId;
  sku: string;
  barcode?: string;
  attributes: Map<string, string>;
  pricePaise: number;
  mrpPaise: number;
  costPricePaise?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  reservedQuantity: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  isDefault: boolean;
  isActive: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------- Schema ----------

const skuSchema = new Schema<ISkuDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true,
    },
    attributes: {
      type: Map,
      of: String,
      default: new Map(),
    },
    pricePaise: {
      type: Number,
      required: [true, 'Price is required'],
      min: [1, 'Price must be at least 1 paise'],
      validate: {
        validator: function (this: ISkuDocument, v: number) {
          return Number.isInteger(v) && v > 0;
        },
        message: 'Price must be a positive integer (in paise)',
      },
    },
    mrpPaise: {
      type: Number,
      required: [true, 'MRP is required'],
      min: [1, 'MRP must be at least 1 paise'],
      validate: {
        validator: function (this: ISkuDocument, v: number) {
          return Number.isInteger(v) && v > 0;
        },
        message: 'MRP must be a positive integer (in paise)',
      },
    },
    costPricePaise: {
      type: Number,
      min: 0,
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Stock quantity cannot be negative'],
      validate: {
        validator: (v: number) => Number.isInteger(v),
        message: 'Stock quantity must be an integer',
      },
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Reserved quantity cannot be negative'],
      validate: {
        validator: (v: number) => Number.isInteger(v),
        message: 'Reserved quantity must be an integer',
      },
    },
    weight: {
      type: Number,
      min: 0,
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'skus',
    optimisticConcurrency: true,
  },
);

// ---------- Indexes ----------

skuSchema.index({ productId: 1, isActive: 1, deletedAt: 1 });
skuSchema.index({ productId: 1, isDefault: 1 });
skuSchema.index({ stockQuantity: 1, isActive: 1 });
skuSchema.index({ barcode: 1 }, { sparse: true });

// ---------- Plugins ----------

skuSchema.plugin(softDeletePlugin);

// ---------- Post-save hook: Update parent Product aggregates ----------

skuSchema.post('save', async function (doc: ISkuDocument) {
  try {
    const ProductModel = mongoose.model('Product');

    // Aggregate all active, non-deleted SKUs for this product
    const aggregation = await mongoose.model<ISkuDocument>('Sku').aggregate([
      {
        $match: {
          productId: doc.productId,
          isActive: true,
          deletedAt: null,
        },
      },
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                minPrice: { $min: '$pricePaise' },
                maxPrice: { $max: '$pricePaise' },
                minMrp: { $min: '$mrpPaise' },
                maxMrp: { $max: '$mrpPaise' },
                totalStock: { $sum: '$stockQuantity' },
                count: { $sum: 1 },
              },
            },
          ],
          defaultSku: [
            { $match: { isDefault: true } },
            { $sort: { pricePaise: 1 } },
            { $limit: 1 },
            { $project: { pricePaise: 1, mrpPaise: 1 } },
          ],
        },
      },
    ]);

    const stats = aggregation[0]?.stats[0] || {
      minPrice: 0,
      maxPrice: 0,
      minMrp: 0,
      maxMrp: 0,
      totalStock: 0,
      count: 0,
    };
    const defaultSku = aggregation[0]?.defaultSku[0];

    const basePrice = defaultSku ? defaultSku.pricePaise : stats.minPrice;
    const baseMrp = defaultSku ? defaultSku.mrpPaise : stats.minMrp;

    await ProductModel.updateOne(
      { _id: doc.productId },
      {
        $set: {
          basePricePaise: basePrice,
          baseMrpPaise: baseMrp,
          minPricePaise: stats.minPrice,
          maxPricePaise: stats.maxPrice,
          minMrpPaise: stats.minMrp,
          maxMrpPaise: stats.maxMrp,
          totalStock: stats.totalStock,
          skuCount: stats.count,
        },
      },
    );
  } catch (err) {
    console.error('Failed to update product aggregates after SKU save:', (err as Error).message);
  }
});

// ---------- Export ----------

export const Sku: Model<ISkuDocument> = mongoose.models.Sku
  || mongoose.model<ISkuDocument>('Sku', skuSchema);
