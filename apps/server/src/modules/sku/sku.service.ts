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
