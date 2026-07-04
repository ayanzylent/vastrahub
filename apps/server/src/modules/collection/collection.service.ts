/**
 * Collection service — business logic for collection operations.
 *
 * Two curation modes:
 *  - manual: `productIds` is the ordered source of truth.
 *  - automated: `rules` + `matchMode` are translated into a Mongoose query.
 *
 * Product resolution mirrors the storefront product-listing machinery in
 * product.service.ts (constraints, price/search/stock filters, sort, pagination).
 */

import mongoose from 'mongoose';
import { Collection, Product } from '../../db/models/index.js';
import type { ICollectionDocument, ICollectionRule } from '../../db/models/index.js';
import { NotFoundError, ValidationError } from '../../lib/errors.js';
import { APP_CONFIG } from '@vastrahub/shared-constants';
import slugify from 'slugify';

// ---------- Interfaces ----------

export interface CollectionRuleInput {
  field: ICollectionRule['field'];
  operator: ICollectionRule['operator'];
  value: string | number | boolean;
}

export interface CreateCollectionInput {
  name: string;
  type?: 'manual' | 'automated';
  description?: string | null;
  image?: string | null;
  bannerImage?: string | null;
  productIds?: string[];
  rules?: CollectionRuleInput[];
  matchMode?: 'all' | 'any';
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  metadata?: {
    metaTitle?: string | null;
    metaDescription?: string | null;
  };
}

export interface UpdateCollectionInput extends Partial<CreateCollectionInput> {}

export interface PaginationOpts {
  page: number;
  limit: number;
  search?: string;
}

export interface StorefrontProductOpts {
  page: number;
  limit: number;
  minPricePaise?: number;
  maxPricePaise?: number;
  inStock?: boolean;
  search?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating';
}

// ---------- Constants ----------

/** Products a storefront customer is allowed to see. */
const STOREFRONT_CONSTRAINTS: Record<string, unknown> = {
  isActive: true,
  publishedAt: { $ne: null },
  deletedAt: null,
};

/** Products the admin may manage/preview (everything not deleted). */
const ADMIN_CONSTRAINTS: Record<string, unknown> = {
  deletedAt: null,
};

// ---------- Helpers ----------

/**
 * Generate a unique slug for a collection, handling collisions.
 */
async function generateCollectionSlug(name: string, excludeId?: mongoose.Types.ObjectId): Promise<string> {
  const baseSlug = slugify(name, { lower: true, strict: true, trim: true });
  let slug = baseSlug || 'collection';
  let counter = 1;

  while (counter <= 100) {
    const filter: Record<string, unknown> = { slug };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const existing = await Collection.findOne(filter).lean();
    if (!existing) break;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

/**
 * Combine filter fragments under a single `$and` to avoid key collisions
 * (e.g. an automated `$or` rule set plus a `$or` search filter).
 */
function composeFilter(...fragments: Array<Record<string, unknown> | undefined>): Record<string, unknown> {
  const parts = fragments.filter(
    (f): f is Record<string, unknown> => !!f && Object.keys(f).length > 0,
  );
  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}

/**
 * Translate a single automated rule into a Mongoose filter fragment.
 * Returns null for rules that cannot be applied (invalid value etc.).
 */
function ruleToFilter(rule: ICollectionRule): Record<string, unknown> | null {
  const { field, operator, value } = rule;

  switch (field) {
    case 'tag': {
      const v = String(value);
      if (!v) return null;
      return operator === 'ne' ? { tags: { $ne: v } } : { tags: v };
    }
    case 'price': {
      const paise = Number(value);
      if (Number.isNaN(paise)) return null;
      const mongoOp =
        operator === 'lt' ? '$lt'
        : operator === 'gt' ? '$gt'
        : operator === 'gte' ? '$gte'
        : '$lte';
      return { minPricePaise: { [mongoOp]: paise } };
    }
    case 'category': {
      const v = String(value);
      if (!mongoose.Types.ObjectId.isValid(v)) return null;
      return { categoryId: new mongoose.Types.ObjectId(v) };
    }
    case 'rating': {
      const r = Number(value);
      if (Number.isNaN(r)) return null;
      return { averageRating: { $gte: r } };
    }
    case 'featured': {
      const b = value === true || value === 'true';
      return { isFeatured: b };
    }
    case 'newerThanDays': {
      const days = Number(value);
      if (Number.isNaN(days) || days <= 0) return null;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      return { createdAt: { $gte: since } };
    }
    default:
      return null;
  }
}

/**
 * Build a Mongoose filter for an automated collection from its rules.
 * No valid rules => match nothing (never the whole catalog).
 */
export function buildAutomatedFilter(
  rules: ICollectionRule[],
  matchMode: 'all' | 'any',
): Record<string, unknown> {
  const fragments = (rules ?? [])
    .map(ruleToFilter)
    .filter((f): f is Record<string, unknown> => f !== null);

  if (fragments.length === 0) {
    return { _id: { $in: [] } };
  }
  if (fragments.length === 1) return fragments[0];
  return matchMode === 'any' ? { $or: fragments } : { $and: fragments };
}

function sortByToMongo(sortBy?: string): Record<string, 1 | -1> | null {
  switch (sortBy) {
    case 'price_asc':
      return { minPricePaise: 1 };
    case 'price_desc':
      return { minPricePaise: -1 };
    case 'newest':
      return { createdAt: -1 };
    case 'rating':
      return { averageRating: -1, reviewCount: -1 };
    default:
      return null;
  }
}

function buildUserFilter(opts: StorefrontProductOpts): Record<string, unknown> {
  const { minPricePaise, maxPricePaise, inStock, search } = opts;
  const filter: Record<string, unknown> = {};

  if (minPricePaise !== undefined || maxPricePaise !== undefined) {
    const priceFilter: Record<string, number> = {};
    if (minPricePaise !== undefined) priceFilter.$gte = minPricePaise;
    if (maxPricePaise !== undefined) priceFilter.$lte = maxPricePaise;
    filter.minPricePaise = priceFilter;
  }
  if (inStock === true) {
    filter.totalStock = { $gt: 0 };
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }
  return filter;
}

function paginate<T>(data: T[], total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
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
 * Resolve the products belonging to a collection, honoring filters + pagination.
 * Manual collections default to curated (`productIds`) order; automated default
 * to newest. An explicit `sortBy` overrides the default in both modes.
 */
export async function resolveCollectionProducts(
  collection: Pick<ICollectionDocument, 'type' | 'productIds' | 'rules' | 'matchMode'>,
  opts: StorefrontProductOpts,
  constraints: Record<string, unknown> = STOREFRONT_CONSTRAINTS,
) {
  const { page, limit, sortBy } = opts;
  const skip = (page - 1) * limit;
  const userFilter = buildUserFilter(opts);
  const sort = sortByToMongo(sortBy);

  if (collection.type === 'manual') {
    const ids = collection.productIds ?? [];
    const baseFilter = composeFilter({ _id: { $in: ids } }, constraints, userFilter);

    // Default sort => preserve curated productIds order.
    if (!sort) {
      const visible = await Product.find(baseFilter).lean();
      const orderMap = new Map(ids.map((id, i) => [String(id), i]));
      visible.sort(
        (a, b) =>
          (orderMap.get(String(a._id)) ?? Number.MAX_SAFE_INTEGER) -
          (orderMap.get(String(b._id)) ?? Number.MAX_SAFE_INTEGER),
      );
      const total = visible.length;
      return paginate(visible.slice(skip, skip + limit), total, page, limit);
    }

    const [products, total] = await Promise.all([
      Product.find(baseFilter).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(baseFilter),
    ]);
    return paginate(products, total, page, limit);
  }

  // Automated collection.
  const ruleFilter = buildAutomatedFilter(collection.rules ?? [], collection.matchMode ?? 'all');
  const baseFilter = composeFilter(ruleFilter, constraints, userFilter);
  const finalSort = sort ?? { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(baseFilter).sort(finalSort).skip(skip).limit(limit).lean(),
    Product.countDocuments(baseFilter),
  ]);
  return paginate(products, total, page, limit);
}

/**
 * Recompute a collection's cached storefront-visible product count.
 */
export async function recalcCollectionProductCount(
  collection: Pick<ICollectionDocument, 'type' | 'productIds' | 'rules' | 'matchMode'>,
): Promise<number> {
  let filter: Record<string, unknown>;
  if (collection.type === 'manual') {
    filter = composeFilter({ _id: { $in: collection.productIds ?? [] } }, STOREFRONT_CONSTRAINTS);
  } else {
    const ruleFilter = buildAutomatedFilter(collection.rules ?? [], collection.matchMode ?? 'all');
    filter = composeFilter(ruleFilter, STOREFRONT_CONSTRAINTS);
  }
  return Product.countDocuments(filter);
}

function toObjectIds(ids?: string[]): mongoose.Types.ObjectId[] {
  if (!ids) return [];
  const seen = new Set<string>();
  const result: mongoose.Types.ObjectId[] = [];
  for (const id of ids) {
    if (!mongoose.Types.ObjectId.isValid(id) || seen.has(id)) continue;
    seen.add(id);
    result.push(new mongoose.Types.ObjectId(id));
  }
  return result;
}

// ---------- Service functions (admin) ----------

export async function createCollection(data: CreateCollectionInput) {
  if ((data.productIds?.length ?? 0) > APP_CONFIG.MAX_PRODUCTS_PER_COLLECTION) {
    throw new ValidationError(
      `A collection cannot have more than ${APP_CONFIG.MAX_PRODUCTS_PER_COLLECTION} products`,
    );
  }
  if ((data.rules?.length ?? 0) > APP_CONFIG.MAX_COLLECTION_RULES) {
    throw new ValidationError(`A collection cannot have more than ${APP_CONFIG.MAX_COLLECTION_RULES} rules`);
  }

  const slug = await generateCollectionSlug(data.name);

  const collection = new Collection({
    name: data.name,
    slug,
    type: data.type ?? 'manual',
    description: data.description ?? undefined,
    image: data.image ?? undefined,
    bannerImage: data.bannerImage ?? undefined,
    productIds: toObjectIds(data.productIds),
    rules: data.rules ?? [],
    matchMode: data.matchMode ?? 'all',
    isActive: data.isActive ?? true,
    isFeatured: data.isFeatured ?? false,
    sortOrder: data.sortOrder ?? 0,
    metadata: data.metadata ?? {},
  });

  collection.productCount = await recalcCollectionProductCount(collection);
  await collection.save();
  return collection.toObject();
}

export async function listCollections(opts: PaginationOpts) {
  const { page, limit, search } = opts;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const [collections, total] = await Promise.all([
    Collection.find(filter).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Collection.countDocuments(filter),
  ]);

  return paginate(collections, total, page, limit);
}

export async function getCollectionById(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid collection ID');
  }
  const collection = await Collection.findById(id).lean();
  if (!collection) {
    throw new NotFoundError('Collection not found');
  }
  return collection;
}

export async function updateCollection(id: string, data: UpdateCollectionInput) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid collection ID');
  }
  if (data.productIds && data.productIds.length > APP_CONFIG.MAX_PRODUCTS_PER_COLLECTION) {
    throw new ValidationError(
      `A collection cannot have more than ${APP_CONFIG.MAX_PRODUCTS_PER_COLLECTION} products`,
    );
  }
  if (data.rules && data.rules.length > APP_CONFIG.MAX_COLLECTION_RULES) {
    throw new ValidationError(`A collection cannot have more than ${APP_CONFIG.MAX_COLLECTION_RULES} rules`);
  }

  const collection = await Collection.findById(id);
  if (!collection) {
    throw new NotFoundError('Collection not found');
  }

  if (data.name !== undefined) {
    collection.name = data.name;
    collection.slug = await generateCollectionSlug(data.name, collection._id as mongoose.Types.ObjectId);
  }
  if (data.type !== undefined) collection.type = data.type;
  if (data.description !== undefined) collection.description = data.description ?? undefined;
  if (data.image !== undefined) collection.image = data.image ?? undefined;
  if (data.bannerImage !== undefined) collection.bannerImage = data.bannerImage ?? undefined;
  if (data.productIds !== undefined) collection.productIds = toObjectIds(data.productIds);
  if (data.rules !== undefined) collection.rules = data.rules as ICollectionRule[];
  if (data.matchMode !== undefined) collection.matchMode = data.matchMode;
  if (data.isActive !== undefined) collection.isActive = data.isActive;
  if (data.isFeatured !== undefined) collection.isFeatured = data.isFeatured;
  if (data.sortOrder !== undefined) collection.sortOrder = data.sortOrder;
  if (data.metadata !== undefined) {
    collection.metadata = {
      metaTitle: data.metadata.metaTitle ?? undefined,
      metaDescription: data.metadata.metaDescription ?? undefined,
    };
  }

  collection.productCount = await recalcCollectionProductCount(collection);
  await collection.save();
  return collection.toObject();
}

export async function deleteCollection(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid collection ID');
  }
  const collection = await Collection.findById(id);
  if (!collection) {
    throw new NotFoundError('Collection not found');
  }
  await Collection.deleteOne({ _id: collection._id });
  return { deleted: true };
}

/**
 * Admin: preview the products a collection currently resolves to
 * (includes unpublished/inactive, excludes deleted) — powers the
 * manual product-picker's saved list and the automated rule preview.
 */
export async function previewCollectionProducts(id: string, opts: StorefrontProductOpts) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid collection ID');
  }
  const collection = await Collection.findById(id).lean();
  if (!collection) {
    throw new NotFoundError('Collection not found');
  }
  return resolveCollectionProducts(collection, opts, ADMIN_CONSTRAINTS);
}

export interface CollectionDraft {
  type?: 'manual' | 'automated';
  productIds?: string[];
  rules?: CollectionRuleInput[];
  matchMode?: 'all' | 'any';
}

/**
 * Admin: preview the products an unsaved collection draft would resolve to.
 * Powers live preview while creating/editing (no persisted id required).
 */
export async function previewCollectionDraft(draft: CollectionDraft, opts: StorefrontProductOpts) {
  return resolveCollectionProducts(
    {
      type: draft.type ?? 'manual',
      productIds: toObjectIds(draft.productIds),
      rules: (draft.rules ?? []) as ICollectionRule[],
      matchMode: draft.matchMode ?? 'all',
    },
    opts,
    ADMIN_CONSTRAINTS,
  );
}

// ---------- Service functions (storefront) ----------

export async function listStorefrontCollections(opts: { featured?: boolean; limit?: number }) {
  const filter: Record<string, unknown> = { isActive: true };
  if (opts.featured) filter.isFeatured = true;

  let query = Collection.find(filter).sort({ sortOrder: 1, name: 1 });
  if (opts.limit) query = query.limit(opts.limit);

  return query.lean();
}

export async function getCollectionBySlugWithProducts(slug: string, opts: StorefrontProductOpts) {
  const collection = await Collection.findOne({ slug, isActive: true }).lean();
  if (!collection) {
    throw new NotFoundError('Collection not found');
  }

  const result = await resolveCollectionProducts(collection, opts);
  return {
    collection,
    products: result.data,
    pagination: result.pagination,
  };
}
