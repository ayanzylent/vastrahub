/**
 * SKU service — business logic for SKU operations.
 */

import mongoose from 'mongoose';
import { Sku, Product } from '../../db/models/index.js';
import type { ISkuDocument } from '../../db/models/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../../lib/errors.js';

// ---------- Interfaces ----------

export interface CreateSkuInput {
  sku: string;
  barcode?: string | null;
  attributes: Record<string, string>;
  pricePaise: number;
  mrpPaise: number;
  costPricePaise?: number | null;
  stockQuantity: number;
  lowStockThreshold?: number;
  weight?: number | null;
  dimensions?: {
    lengthCm?: number | null;
    widthCm?: number | null;
    heightCm?: number | null;
  };
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateSkuInput extends Partial<CreateSkuInput> {
  __v?: number;
}

// ---------- Service functions ----------

/**
 * Recalculate and update a product's aggregate fields (price range, stock, SKU count)
 * from its active, non-deleted SKUs.
 *
 * This is the same logic as the SKU model's post-save hook, extracted so it can be
 * called explicitly after bulk operations (e.g., cascade soft-delete) where the
 * Mongoose hook doesn't fire.
 */
export async function recalculateProductAggregates(productId: mongoose.Types.ObjectId | string) {
  const pid = typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;

  const aggregation = await Sku.aggregate([
    {
      $match: {
        productId: pid,
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

  await Product.updateOne(
    { _id: pid },
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
}

/**
 * Create a SKU for a product.
 */
export async function createSku(productId: string, data: CreateSkuInput) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ValidationError('Invalid product ID');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Validate price <= MRP
  if (data.pricePaise > data.mrpPaise) {
    throw new ValidationError('Price cannot exceed MRP');
  }

  // Check SKU code uniqueness
  const existingSku = await Sku.findOne({ sku: data.sku.toUpperCase() }).lean();
  if (existingSku) {
    throw new ConflictError(`SKU code "${data.sku}" is already in use`);
  }

  // Deep Link Validation: Attributes against variantOptions
  const variantKeys = new Set(product.variantOptions.map(opt => opt.name));
  const attributeKeys = Object.keys(data.attributes);

  if (attributeKeys.length !== variantKeys.size || !attributeKeys.every(k => variantKeys.has(k))) {
    throw new ValidationError(`SKU attributes must exactly match the product's variant options: [${Array.from(variantKeys).join(', ')}]`);
  }

  for (const opt of product.variantOptions) {
    const providedValue = data.attributes[opt.name];
    const allowedValues = new Set(opt.values.map(v => v.value));
    if (!allowedValues.has(providedValue)) {
      throw new ValidationError(`Invalid value "${providedValue}" for attribute "${opt.name}". Allowed values: [${Array.from(allowedValues).join(', ')}]`);
    }
  }

  // Combination Uniqueness
  const existingSkus = await Sku.find({ productId: product._id, isActive: true, deletedAt: null }).lean();
  for (const s of existingSkus) {
    const sAttrs = s.attributes instanceof Map ? Object.fromEntries(s.attributes) : (s.attributes as Record<string, string>);
    let isDuplicate = true;
    for (const key of attributeKeys) {
      if (sAttrs[key] !== data.attributes[key]) {
        isDuplicate = false;
        break;
      }
    }
    if (isDuplicate) {
      throw new ConflictError(`An active SKU with this exact attribute combination already exists (${s.sku})`);
    }
  }

  const attributesMap = new Map(Object.entries(data.attributes));

  const sku = new Sku({
    productId: new mongoose.Types.ObjectId(productId),
    sku: data.sku,
    barcode: data.barcode ?? undefined,
    attributes: attributesMap,
    pricePaise: data.pricePaise,
    mrpPaise: data.mrpPaise,
    costPricePaise: data.costPricePaise ?? undefined,
    stockQuantity: data.stockQuantity,
    lowStockThreshold: data.lowStockThreshold ?? 5,
    reservedQuantity: 0,
    weight: data.weight ?? undefined,
    dimensions: data.dimensions
      ? {
          length: data.dimensions.lengthCm ?? undefined,
          width: data.dimensions.widthCm ?? undefined,
          height: data.dimensions.heightCm ?? undefined,
        }
      : undefined,
    isDefault: data.isDefault ?? false,
    isActive: data.isActive ?? true,
  });

  await sku.save();
  return sku.toObject();
}

/**
 * List SKUs for a product.
 */
export async function listSkusForProduct(productId: string) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ValidationError('Invalid product ID');
  }

  const skus = await Sku.find({ productId: new mongoose.Types.ObjectId(productId) })
    .sort({ isDefault: -1, createdAt: 1 })
    .lean();

  return skus;
}

/**
 * Update a SKU with OCC check.
 */
export async function updateSku(id: string, data: UpdateSkuInput) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid SKU ID');
  }

  const sku = await Sku.findById(id);
  if (!sku) {
    throw new NotFoundError('SKU not found');
  }

  // OCC check
  if (data.__v !== undefined && sku.__v !== data.__v) {
    throw new ConflictError(
      'SKU was modified by another user. Please refresh and try again.',
    );
  }

  // Validate price <= MRP if either changes
  const newPrice = data.pricePaise ?? sku.pricePaise;
  const newMrp = data.mrpPaise ?? sku.mrpPaise;
  if (newPrice > newMrp) {
    throw new ValidationError('Price cannot exceed MRP');
  }

  // Validate reserved quantity does not exceed stock
  const newStock = data.stockQuantity ?? sku.stockQuantity;
  const newReserved = sku.reservedQuantity;
  if (newReserved > newStock) {
    throw new ValidationError(
      `Stock quantity (${newStock}) cannot be less than reserved quantity (${newReserved})`,
    );
  }

  // If SKU code changing, check uniqueness
  if (data.sku && data.sku.toUpperCase() !== sku.sku) {
    const existing = await Sku.findOne({
      sku: data.sku.toUpperCase(),
      _id: { $ne: sku._id },
    }).lean();
    if (existing) {
      throw new ConflictError(`SKU code "${data.sku}" is already in use`);
    }
    sku.sku = data.sku;
  }

  if (data.attributes !== undefined) {
    const product = await mongoose.model('Product').findById(sku.productId).lean();
    if (product) {
      // @ts-ignore
      const variantKeys = new Set(product.variantOptions.map(opt => opt.name));
      const attributeKeys = Object.keys(data.attributes);

      if (attributeKeys.length !== variantKeys.size || !attributeKeys.every(k => variantKeys.has(k))) {
        throw new ValidationError(`SKU attributes must exactly match the product's variant options: [${Array.from(variantKeys).join(', ')}]`);
      }

      // @ts-ignore
      for (const opt of product.variantOptions) {
        const providedValue = data.attributes[opt.name];
        // @ts-ignore
        const allowedValues = new Set(opt.values.map(v => v.value));
        if (!allowedValues.has(providedValue)) {
          throw new ValidationError(`Invalid value "${providedValue}" for attribute "${opt.name}". Allowed values: [${Array.from(allowedValues).join(', ')}]`);
        }
      }

      // Combination Uniqueness
      const existingSkus = await Sku.find({ 
        productId: sku.productId, 
        isActive: true, 
        deletedAt: null,
        _id: { $ne: sku._id }
      }).lean();
      
      for (const s of existingSkus) {
        const sAttrs = s.attributes instanceof Map ? Object.fromEntries(s.attributes) : (s.attributes as Record<string, string>);
        let isDuplicate = true;
        for (const key of attributeKeys) {
          if (sAttrs[key] !== data.attributes[key]) {
            isDuplicate = false;
            break;
          }
        }
        if (isDuplicate) {
          throw new ConflictError(`An active SKU with this exact attribute combination already exists (${s.sku})`);
        }
      }
    }
  }

  if (data.barcode !== undefined) sku.barcode = data.barcode ?? undefined;
  if (data.attributes !== undefined) sku.attributes = new Map(Object.entries(data.attributes));
  if (data.pricePaise !== undefined) sku.pricePaise = data.pricePaise;
  if (data.mrpPaise !== undefined) sku.mrpPaise = data.mrpPaise;
  if (data.costPricePaise !== undefined) sku.costPricePaise = data.costPricePaise ?? undefined;
  if (data.stockQuantity !== undefined) sku.stockQuantity = data.stockQuantity;
  if (data.lowStockThreshold !== undefined) sku.lowStockThreshold = data.lowStockThreshold;
  if (data.weight !== undefined) sku.weight = data.weight ?? undefined;
  if (data.dimensions !== undefined) {
    sku.dimensions = data.dimensions
      ? {
          length: data.dimensions.lengthCm ?? undefined,
          width: data.dimensions.widthCm ?? undefined,
          height: data.dimensions.heightCm ?? undefined,
        }
      : undefined;
  }
  if (data.isDefault !== undefined) sku.isDefault = data.isDefault;
  if (data.isActive !== undefined) sku.isActive = data.isActive;

  await sku.save();
  return sku.toObject();
}

/**
 * Soft-delete a SKU.
 */
export async function deleteSku(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid SKU ID');
  }

  const sku = await Sku.findById(id);
  if (!sku) {
    throw new NotFoundError('SKU not found');
  }

  if (typeof (sku as ISkuDocument & { softDelete: () => Promise<void> }).softDelete === 'function') {
    await (sku as ISkuDocument & { softDelete: () => Promise<void> }).softDelete();
  } else {
    sku.deletedAt = new Date();
    await sku.save();
  }

  return { deleted: true };
}

/**
 * Update stock quantity (absolute).
 */
export async function updateStock(id: string, quantity: number) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid SKU ID');
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new ValidationError('Stock quantity must be a non-negative integer');
  }

  const sku = await Sku.findById(id);
  if (!sku) {
    throw new NotFoundError('SKU not found');
  }

  // Validate >= reservedQuantity
  if (quantity < sku.reservedQuantity) {
    throw new ValidationError(
      `Stock quantity (${quantity}) cannot be less than reserved quantity (${sku.reservedQuantity})`,
    );
  }

  sku.stockQuantity = quantity;
  await sku.save();

  return sku.toObject();
}

/**
 * Generate a unique SKU code from product slug + variant attribute values.
 * Format: SLUG-PREFIX-ATTR1-ATTR2 (uppercased, truncated for readability).
 * If a collision is detected, appends -2, -3, etc.
 */
export async function generateSkuCode(productId: string, attributes: Record<string, string>): Promise<string> {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ValidationError('Invalid product ID');
  }

  const product = await Product.findById(productId).lean();
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Build prefix from product slug (uppercase, truncate)
  const slugPrefix = product.slug
    .toUpperCase()
    .replace(/-/g, '-')
    .slice(0, 20);

  // Build suffix from attribute values in the order of variantOptions
  const attrParts: string[] = [];
  for (const opt of product.variantOptions) {
    const val = attributes[opt.name];
    if (val) {
      attrParts.push(val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
    }
  }

  const baseSku = [slugPrefix, ...attrParts].join('-');

  // Check uniqueness and find available code
  let candidate = baseSku;
  let suffix = 1;
  while (true) {
    const existing = await Sku.findOne({ sku: candidate }).lean();
    if (!existing) break;
    suffix++;
    candidate = `${baseSku}-${suffix}`;
  }

  return candidate;
}

/**
 * Get SKU details for storefront (populated with product info).
 */
export async function getStorefrontSku(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid SKU ID');
  }

  const sku = await Sku.findOne({
    _id: new mongoose.Types.ObjectId(id),
    isActive: true,
    deletedAt: null,
  }).lean();

  if (!sku) {
    throw new NotFoundError('SKU not found or not active');
  }

  const product = await Product.findById(sku.productId).lean();
  if (!product) {
    throw new NotFoundError('Product not found for this SKU');
  }

  // Get cover image
  const coverGroup = product.variantMedia?.find((vm: any) => vm.isCoverGroup);
  const firstImage = coverGroup?.media?.find((m: any) => m.type === 'image');
  const imageUrl = firstImage?.url ?? coverGroup?.media?.[0]?.url;

  return {
    _id: sku._id,
    productId: sku.productId,
    productName: product.name,
    skuCode: sku.sku,
    pricePaise: sku.pricePaise,
    mrpPaise: sku.mrpPaise,
    attributes: sku.attributes,
    stockQuantity: sku.stockQuantity,
    imageUrl,
  };
}
