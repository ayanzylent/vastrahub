/**
 * Product service — business logic for product operations.
 * The most complex module: handles slug management, OCC, publishing, and storefront queries.
 */

import mongoose from 'mongoose';
import { Product, Sku, Category } from '../../db/models/index.js';
import type { IProductDocument, IVariantMedia } from '../../db/models/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../../lib/errors.js';
import { generateUniqueSlug } from '../../lib/slug.js';
import { GST_SLABS, APP_CONFIG } from '../../constants/index.js';
import { recalculateProductAggregates } from '../sku/sku.service.js';
import { updateCategoryProductCounts } from '../category/category.service.js';

// ---------- Interfaces ----------

export interface CreateProductInput {
  name: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  brand?: string;
  tags?: string[];
  styleCode?: string | null;
  variantOptions?: Array<{
    name: string;
    type: string;
    values: Array<{ value: string; label: string; slug?: string }>;
  }>;
  visualAttributeName?: string | null;
  showVisualSelector?: boolean;
  variantMedia: Array<{
    variantValue: string | null;
    variantLabel: string | null;
    variantSlug: string | null;
    media: Array<{
      type: 'image' | 'video';
      url: string;
      alt: string;
      sortOrder: number;
      thumbnailUrl?: string | null;
      durationSecs?: number | null;
      mimeType: string;
    }>;
    isCoverGroup: boolean;
  }>;
  material?: string | null;
  careInstructions?: string | null;
  originCountry?: string;
  hsn?: string | null;
  gstPercentage?: number | null;
  isActive?: boolean;
  isFeatured?: boolean;
  metadata?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  __v?: number;
  averageRating?: number;
  reviewCount?: number;
}

export interface ProductListOpts {
  page: number;
  limit: number;
  categoryId?: string;
  categorySlug?: string;
  status?: string;
  search?: string;
}

export interface StorefrontListOpts {
  page: number;
  limit: number;
  categoryId?: string;
  categorySlug?: string;
  minPricePaise?: number;
  maxPricePaise?: number;
  brands?: string[];
  tags?: string[];
  inStock?: boolean;
  search?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'popularity';
}

// ---------- Service functions ----------

/**
 * Create a new product.
 */
export async function createProduct(data: CreateProductInput) {
  // Validate categoryId
  if (!mongoose.Types.ObjectId.isValid(data.categoryId)) {
    throw new ValidationError('Invalid category ID');
  }
  const category = await Category.findById(data.categoryId);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Validate variant options and visual axis are required
  if (!data.variantOptions || data.variantOptions.length === 0) {
    throw new ValidationError('At least one variant option is required.');
  }
  if (!data.visualAttributeName) {
    throw new ValidationError('Visual attribute name (image gallery axis) is required.');
  }

  // Validate variantMedia has exactly 1 isCoverGroup=true and all media items have mimeType
  if (data.variantMedia && data.variantMedia.length > 0) {
    const coverGroups = data.variantMedia.filter((vm) => vm.isCoverGroup);
    if (coverGroups.length !== 1) {
      throw new ValidationError(
        `variantMedia must have exactly one entry with isCoverGroup=true (found ${coverGroups.length})`,
      );
    }

    for (const vm of data.variantMedia) {
      if (vm.media) {
        for (const m of vm.media) {
          if (!m.mimeType) {
            throw new ValidationError('Each media item must have a valid mimeType.');
          }
        }
      }
    }
  }

  // Deep Link Validation: visualAttributeName and variantMedia against variantOptions
  if (data.visualAttributeName) {
    const hasVisualAttr = data.variantOptions?.some(opt => opt.name === data.visualAttributeName);
    if (!hasVisualAttr) {
      throw new ValidationError(`visualAttributeName "${data.visualAttributeName}" must match one of the variantOptions`);
    }

    const visualOption = data.variantOptions?.find(opt => opt.name === data.visualAttributeName);
    if (data.variantMedia && data.variantMedia.length > 0 && visualOption) {
      const allowedValues = new Set(visualOption.values.map(v => v.value));
      for (const vm of data.variantMedia) {
        if (!vm.variantValue || !allowedValues.has(vm.variantValue)) {
          throw new ValidationError(`variantMedia variantValue "${vm.variantValue}" is not an allowed value for the visual attribute "${data.visualAttributeName}"`);
        }
      }
    }
  }

  // Validate GST slab
  if (data.gstPercentage !== undefined && data.gstPercentage !== null) {
    if (!(GST_SLABS as readonly number[]).includes(data.gstPercentage)) {
      throw new ValidationError('GST percentage must be one of: 0, 5, 12, 18, 28');
    }
  }

  // Generate slug
  const slug = await generateUniqueSlug(data.name, Product as mongoose.Model<unknown>);

  const product = new Product({
    name: data.name,
    slug,
    description: data.description,
    shortDescription: data.shortDescription,
    categoryId: new mongoose.Types.ObjectId(data.categoryId),
    brand: data.brand,
    tags: data.tags ?? [],
    styleCode: data.styleCode ?? undefined,
    variantOptions: data.variantOptions ?? [],
    visualAttributeName: data.visualAttributeName ?? undefined,
    showVisualSelector: data.showVisualSelector ?? true,
    variantMedia: data.variantMedia ?? [],
    material: data.material ?? undefined,
    careInstructions: data.careInstructions ?? undefined,
    originCountry: data.originCountry ?? 'India',
    hsn: data.hsn ?? undefined,
    gstPercentage: data.gstPercentage ?? null,
    isActive: data.isActive ?? true,
    isFeatured: data.isFeatured ?? false,
    metadata: data.metadata ?? {},
  });

  await product.save();
  await updateCategoryProductCounts(product.categoryId);
  return product.toObject();
}

/**
 * List products (admin view, paginated with filters).
 */
export async function listProducts(opts: ProductListOpts) {
  const { page, limit, categoryId, categorySlug, status, search } = opts;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (categoryId) {
    filter.categoryId = new mongoose.Types.ObjectId(categoryId);
  } else if (categorySlug) {
    const cat = await Category.findOne({ slug: categorySlug }).lean();
    if (cat) {
      filter.categoryId = cat._id;
    }
  }

  if (status === 'active') filter.isActive = true;
  else if (status === 'inactive') filter.isActive = false;
  else if (status === 'published') filter.publishedAt = { $ne: null };
  else if (status === 'draft') filter.publishedAt = null;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  const [rawProducts, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('categoryId', 'name')
      .lean(),
    Product.countDocuments(filter),
  ]);

  const products = rawProducts.map((p: any) => ({
    ...p,
    category: p.categoryId ? { name: p.categoryId.name } : undefined,
    categoryId: p.categoryId ? p.categoryId._id : undefined,
  }));

  const totalPages = Math.ceil(total / limit);

  return {
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Get product by ID with populated SKUs (admin view).
 */
export async function getProductByIdWithSkus(id: string): Promise<Record<string, unknown>> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid product ID');
  }

  const product = await Product.findById(id).lean();
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const skus = await Sku.find({
    productId: product._id,
  })
    .sort({ isDefault: -1, createdAt: 1 })
    .lean();

  return { ...product, skus };
}

/**
 * Update product with OCC check.
 */
export async function updateProduct(id: string, data: UpdateProductInput, userId?: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid product ID');
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const oldCategoryId = product.categoryId;
  const oldActive = product.isActive;

  // OCC check
  if (data.__v !== undefined && product.__v !== data.__v) {
    throw new ConflictError(
      'Product was modified by another user. Please refresh and try again.',
    );
  }

  // If categoryId changing, validate
  if (data.categoryId && data.categoryId !== String(product.categoryId)) {
    if (!mongoose.Types.ObjectId.isValid(data.categoryId)) {
      throw new ValidationError('Invalid category ID');
    }
    const cat = await Category.findById(data.categoryId);
    if (!cat) {
      throw new NotFoundError('Category not found');
    }
    product.categoryId = new mongoose.Types.ObjectId(data.categoryId);
  }

  // Validate variantMedia if provided
  if (data.variantMedia && data.variantMedia.length > 0) {
    const coverGroups = data.variantMedia.filter((vm) => vm.isCoverGroup);
    if (coverGroups.length !== 1) {
      throw new ValidationError(
        `variantMedia must have exactly one entry with isCoverGroup=true (found ${coverGroups.length})`,
      );
    }

    for (const vm of data.variantMedia) {
      if (vm.media) {
        for (const m of vm.media) {
          if (!m.mimeType) {
            throw new ValidationError('Each media item must have a valid mimeType.');
          }
        }
      }
    }
  }

  // Combine for deep link validation
  const variantOptions = data.variantOptions !== undefined ? data.variantOptions : product.variantOptions;
  const visualAttributeName = data.visualAttributeName !== undefined ? data.visualAttributeName : product.visualAttributeName;
  const variantMedia = data.variantMedia !== undefined ? data.variantMedia : product.variantMedia;

  // Enforce variant requirements
  if (!variantOptions || variantOptions.length === 0) {
    throw new ValidationError('At least one variant option is required.');
  }
  if (!visualAttributeName) {
    throw new ValidationError('Visual attribute name (image gallery axis) is required.');
  }

  // Deep Link Validation: visualAttributeName and variantMedia against variantOptions
  const hasVisualAttr = variantOptions.some(opt => opt.name === visualAttributeName);
  if (!hasVisualAttr) {
    throw new ValidationError(`visualAttributeName "${visualAttributeName}" must match one of the variantOptions`);
  }

  const visualOption = variantOptions.find(opt => opt.name === visualAttributeName);
  if (variantMedia && variantMedia.length > 0 && visualOption) {
    const allowedValues = new Set(visualOption.values.map(v => v.value));
    for (const vm of variantMedia) {
      if (!vm.variantValue || !allowedValues.has(vm.variantValue)) {
        throw new ValidationError(`variantMedia variantValue "${vm.variantValue}" is not an allowed value for the visual attribute "${visualAttributeName}"`);
      }
    }
  }

  // Conflict Check: Prevent removing options or values in use by active SKUs
  if (data.variantOptions !== undefined) {
    const activeSkus = await mongoose.model('Sku').find({ productId: product._id, isActive: true, deletedAt: null }).lean();
    
    const allowedKeys = new Set(data.variantOptions.map(opt => opt.name));
    const allowedValuesMap = new Map(data.variantOptions.map(opt => [opt.name, new Set(opt.values.map(v => v.value))]));

    for (const sku of activeSkus) {
      // Mongoose Map in lean() usually comes back as an Object or Map depending on version/config
      const attributes = sku.attributes instanceof Map ? Object.fromEntries(sku.attributes) : (sku.attributes as Record<string, string>);
      for (const [key, value] of Object.entries(attributes || {})) {
        if (!allowedKeys.has(key)) {
          throw new ConflictError(`Cannot remove variant option "${key}" as it is currently in use by active SKU "${sku.sku}"`);
        }
        if (!allowedValuesMap.get(key)?.has(value as string)) {
          throw new ConflictError(`Cannot remove variant option value "${value}" for "${key}" as it is currently in use by active SKU "${sku.sku}"`);
        }
      }
    }
  }

  // Handle slug change via name change (only if not manual slug)
  if (data.name && data.name !== product.name && !product.isSlugManual) {
    const oldSlug = product.slug;
    const newSlug = await generateUniqueSlug(data.name, Product as mongoose.Model<unknown>, id);

    if (newSlug !== oldSlug) {
      product.slugHistory.push({
        slug: oldSlug,
        changedAt: new Date(),
        changedBy: userId ?? 'system',
      });
      product.slug = newSlug;
    }
  }

  // Apply field updates
  if (data.name !== undefined) product.name = data.name;
  if (data.description !== undefined) product.description = data.description;
  if (data.shortDescription !== undefined) product.shortDescription = data.shortDescription;
  if (data.brand !== undefined) product.brand = data.brand;
  if (data.tags !== undefined) product.tags = data.tags;
  if (data.styleCode !== undefined) product.styleCode = data.styleCode ?? undefined;
  if (data.variantOptions !== undefined) product.variantOptions = data.variantOptions as IProductDocument['variantOptions'];
  if (data.visualAttributeName !== undefined) product.visualAttributeName = data.visualAttributeName ?? undefined;
  if (data.showVisualSelector !== undefined) product.showVisualSelector = data.showVisualSelector;
  if (data.variantMedia !== undefined) product.variantMedia = data.variantMedia as IProductDocument['variantMedia'];
  if (data.material !== undefined) product.material = data.material ?? undefined;
  if (data.careInstructions !== undefined) product.careInstructions = data.careInstructions ?? undefined;
  if (data.originCountry !== undefined) product.originCountry = data.originCountry;
  if (data.hsn !== undefined) product.hsn = data.hsn ?? undefined;
  if (data.gstPercentage !== undefined) product.gstPercentage = data.gstPercentage ?? null;
  if (data.isActive !== undefined) product.isActive = data.isActive;
  if (data.isFeatured !== undefined) product.isFeatured = data.isFeatured;
  if (data.metadata !== undefined) {
    product.metadata = {
      ...product.metadata,
      ...(data.metadata.metaTitle !== undefined && { metaTitle: data.metadata.metaTitle }),
      ...(data.metadata.metaDescription !== undefined && { metaDescription: data.metadata.metaDescription }),
    };
  }
  if (data.averageRating !== undefined) product.averageRating = data.averageRating;
  if (data.reviewCount !== undefined) product.reviewCount = data.reviewCount;

  await product.save();

  // Trigger category product count updates if category or active status changed
  const categoryChanged = String(product.categoryId) !== String(oldCategoryId);
  const activeChanged = product.isActive !== oldActive;

  if (categoryChanged) {
    await updateCategoryProductCounts(oldCategoryId);
    await updateCategoryProductCounts(product.categoryId);
  } else if (activeChanged) {
    await updateCategoryProductCounts(product.categoryId);
  }

  return product.toObject();
}

/**
 * Soft-delete a product and cascade soft-delete all its SKUs.
 * Also recalculates the product's aggregate fields so they reflect
 * zero active SKUs (important if the product is later restored).
 */
export async function deleteProduct(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid product ID');
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const OrderModel = mongoose.model('Order');
  const activeOrderCount = await OrderModel.countDocuments({
    'items.productId': product._id,
    status: { $in: ['pending', 'confirmed', 'processing', 'shipped', 'return_requested'] },
  });
  if (activeOrderCount > 0) {
    if (product.isActive) {
      product.isActive = false;
      await product.save();
    }
    throw new ConflictError(
      `Cannot delete product "${product.name}" as it has SKUs referenced in ${activeOrderCount} active order(s). It has been deactivated to prevent new orders.`,
    );
  }

  const now = new Date();

  // Cascade: soft-delete all non-deleted SKUs for this product.
  // Uses updateMany for efficiency — the post-save hook won't fire,
  // so we explicitly recalculate aggregates below.
  await Sku.updateMany(
    { productId: product._id, deletedAt: null },
    { $set: { deletedAt: now } },
  );

  // Recalculate product aggregates (will set everything to 0 since all SKUs are now deleted).
  // This ensures correct state if the product is ever restored.
  await recalculateProductAggregates(product._id);

  // Soft-delete the product itself
  if (typeof (product as IProductDocument & { softDelete: () => Promise<void> }).softDelete === 'function') {
    await (product as IProductDocument & { softDelete: () => Promise<void> }).softDelete();
  } else {
    product.deletedAt = now;
    await product.save();
  }

  // Update category product count after soft-deletion
  await updateCategoryProductCounts(product.categoryId);

  return { deleted: true };
}

/**
 * Publish a product.
 */
export async function publishProduct(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid product ID');
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Validate has at least 1 active SKU
  const activeSkuCount = await Sku.countDocuments({
    productId: product._id,
    isActive: true,
    deletedAt: null,
  });
  if (activeSkuCount === 0) {
    throw new ValidationError('Product must have at least 1 active SKU before publishing');
  }

  // Validate has media
  const hasMedia = product.variantMedia.some(
    (vm: IVariantMedia) => vm.media && vm.media.length > 0,
  );
  if (!hasMedia) {
    throw new ValidationError('Product must have at least one media item before publishing');
  }

  product.publishedAt = new Date();
  await product.save();

  return product.toObject();
}

/**
 * Unpublish a product.
 */
export async function unpublishProduct(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid product ID');
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  product.publishedAt = null;
  await product.save();

  return product.toObject();
}

/**
 * Set a manual slug for a product.
 */
export async function setManualSlug(id: string, newSlug: string, userId?: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid product ID');
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Check collision
  const existing = await Product.findOne({
    $or: [{ slug: newSlug }, { 'slugHistory.slug': newSlug }],
    _id: { $ne: product._id },
  }).lean();

  if (existing) {
    throw new ConflictError(`Slug "${newSlug}" is already in use`);
  }

  const oldSlug = product.slug;
  if (oldSlug !== newSlug) {
    product.slugHistory.push({
      slug: oldSlug,
      changedAt: new Date(),
      changedBy: userId ?? 'system',
    });
  }

  product.slug = newSlug;
  product.isSlugManual = true;
  await product.save();

  return product.toObject();
}

/**
 * Regenerate slug from product name (auto mode).
 */
export async function regenerateSlug(id: string, userId?: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid product ID');
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const oldSlug = product.slug;
  const newSlug = await generateUniqueSlug(product.name, Product as mongoose.Model<unknown>, id);

  if (oldSlug !== newSlug) {
    product.slugHistory.push({
      slug: oldSlug,
      changedAt: new Date(),
      changedBy: userId ?? 'system',
    });
  }

  product.slug = newSlug;
  product.isSlugManual = false;
  await product.save();

  return product.toObject();
}

/**
 * Get slug history for a product.
 */
export async function getSlugHistory(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid product ID');
  }

  const product = await Product.findById(id).select('slug slugHistory isSlugManual').lean();
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  return {
    currentSlug: product.slug,
    isSlugManual: product.isSlugManual,
    history: product.slugHistory,
  };
}

/**
 * Remove a slug history entry.
 */
export async function removeSlugHistoryEntry(id: string, oldSlug: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid product ID');
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const idx = product.slugHistory.findIndex(
    (entry) => entry.slug === oldSlug,
  );
  if (idx === -1) {
    throw new NotFoundError('Slug history entry not found');
  }

  product.slugHistory.splice(idx, 1);
  await product.save();

  return { removed: oldSlug };
}

/**
 * Storefront: list active+published products with filters.
 */
export async function listStorefrontProducts(opts: StorefrontListOpts) {
  const { page, limit, categoryId, categorySlug, minPricePaise, maxPricePaise, brands, tags, inStock, search, sortBy } = opts;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {
    isActive: true,
    publishedAt: { $ne: null },
    deletedAt: null,
  };

  // Category filter
  if (categoryId) {
    filter.categoryId = new mongoose.Types.ObjectId(categoryId);
  } else if (categorySlug) {
    const cat = await Category.findOne({ slug: categorySlug, isActive: true }).lean();
    if (cat) {
      // Include the category and all its descendants
      const descendantIds = await Category.find({
        'ancestors._id': cat._id,
        isActive: true,
      }).distinct('_id');
      filter.categoryId = { $in: [cat._id, ...descendantIds] };
    }
  }

  // Price range filter
  if (minPricePaise !== undefined || maxPricePaise !== undefined) {
    const priceFilter: Record<string, number> = {};
    if (minPricePaise !== undefined) priceFilter.$gte = minPricePaise;
    if (maxPricePaise !== undefined) priceFilter.$lte = maxPricePaise;
    filter.minPricePaise = priceFilter;
  }

  // Brands filter
  if (brands && brands.length > 0) {
    filter.brand = { $in: brands };
  }

  // Tags filter
  if (tags && tags.length > 0) {
    filter.tags = { $in: tags };
  }

  // In-stock filter
  if (inStock === true) {
    filter.totalStock = { $gt: 0 };
  }

  // Text search
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  // Sort
  let sort: Record<string, 1 | -1> = { createdAt: -1 };
  switch (sortBy) {
    case 'price_asc':
      sort = { minPricePaise: 1 };
      break;
    case 'price_desc':
      sort = { minPricePaise: -1 };
      break;
    case 'newest':
      sort = { createdAt: -1 };
      break;
    case 'rating':
      sort = { averageRating: -1, reviewCount: -1 };
      break;
    case 'popularity':
      sort = { reviewCount: -1 };
      break;
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Storefront: get product by slug (with redirect support for old slugs).
 */
export async function getProductBySlug(slug: string): Promise<Record<string, unknown>> {
  // Try current slug first
  const product = await Product.findOne({
    slug,
    isActive: true,
    publishedAt: { $ne: null },
    deletedAt: null,
  }).lean();

  if (product) {
    // Get sister products if styleCode is set
    let sisterProducts: unknown[] = [];
    if (product.styleCode) {
      sisterProducts = await getSisterProducts(product.styleCode, String(product._id));
    }

    // Get SKUs
    const skus = await Sku.find({
      productId: product._id,
      isActive: true,
      deletedAt: null,
    }).lean();

    return { product: { ...product, skus, sisterProducts }, redirect: false };
  }

  // Check slugHistory for redirect
  const redirectProduct = await Product.findOne({
    'slugHistory.slug': slug,
    isActive: true,
    publishedAt: { $ne: null },
    deletedAt: null,
  }).lean();

  if (redirectProduct) {
    return {
      product: redirectProduct,
      redirect: true,
      newSlug: redirectProduct.slug,
    };
  }

  throw new NotFoundError('Product not found');
}

/**
 * Get sister products (same styleCode, different product).
 */
export async function getSisterProducts(styleCode: string, excludeId: string) {
  return Product.find({
    styleCode,
    _id: { $ne: new mongoose.Types.ObjectId(excludeId) },
    isActive: true,
    deletedAt: null,
  })
    .select('name slug variantMedia basePricePaise baseMrpPaise minPricePaise maxPricePaise minMrpPaise maxMrpPaise')
    .lean();
}

/**
 * Get featured products (storefront).
 */
export async function getFeaturedProducts(limit: number = 10) {
  return Product.find({
    isActive: true,
    isFeatured: true,
    publishedAt: { $ne: null },
    deletedAt: null,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
