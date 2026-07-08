/**
 * Category service — business logic for category operations.
 */

import mongoose from 'mongoose';
import { Category } from '../../db/models/index.js';
import type { ICategoryDocument, ICategoryAncestor } from '../../db/models/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../../lib/errors.js';
import { APP_CONFIG } from '@vastrahub/shared-constants';
import slugify from 'slugify';

// ---------- Interfaces ----------

export interface CreateCategoryInput {
  name: string;
  parentId?: string | null;
  description?: string | null;
  image?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  metadata?: {
    metaTitle?: string | null;
    metaDescription?: string | null;
  };
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {}

export interface CategoryTreeNode {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sortOrder: number;
  productCount: number;
  children: CategoryTreeNode[];
}

export interface PaginationOpts {
  page: number;
  limit: number;
  search?: string;
}

// ---------- Helpers ----------

/**
 * Generate a unique slug for a category, handling collisions.
 * Replaces the slug generation that was in the pre('save') hook.
 */
async function generateCategorySlug(name: string, excludeId?: mongoose.Types.ObjectId): Promise<string> {
  const baseSlug = slugify(name, { lower: true, strict: true, trim: true });
  let slug = baseSlug;
  let counter = 1;

  while (counter <= 100) {
    const filter: Record<string, unknown> = { slug };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const existing = await Category.findOne(filter).lean();
    if (!existing) break;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

/**
 * Build ancestors array and level for a category based on its parentId.
 * Replaces the ancestors population that was in the pre('save') hook.
 */
async function buildCategoryAncestors(parentId: mongoose.Types.ObjectId | string | null): Promise<{
  ancestors: ICategoryAncestor[];
  level: number;
}> {
  if (!parentId) {
    return { ancestors: [], level: 0 };
  }

  const parent = await Category.findById(parentId);
  if (!parent) {
    throw new NotFoundError('Parent category not found');
  }

  if (parent.level >= APP_CONFIG.MAX_CATEGORY_DEPTH - 1) {
    throw new ValidationError(
      `Maximum category depth of ${APP_CONFIG.MAX_CATEGORY_DEPTH} levels exceeded`,
    );
  }

  return {
    ancestors: [
      ...parent.ancestors,
      {
        _id: parent._id as mongoose.Types.ObjectId,
        name: parent.name,
        slug: parent.slug,
      },
    ],
    level: parent.level + 1,
  };
}

/**
 * Recalculates the recursive active product count for a single category,
 * including all active products in its subcategories.
 */
export async function recalculateCategoryProductCount(categoryId: mongoose.Types.ObjectId | string): Promise<number> {
  const catId = typeof categoryId === 'string' ? new mongoose.Types.ObjectId(categoryId) : categoryId;

  // Find all active subcategories under this category
  const descendants = await Category.find({ 'ancestors._id': catId, isActive: true }).select('_id').lean();
  const categoryIds = [catId, ...descendants.map(d => d._id)];

  const ProductModel = mongoose.model('Product');
  const count = await ProductModel.countDocuments({
    categoryId: { $in: categoryIds },
    isActive: true,
    deletedAt: null,
  });

  await Category.updateOne({ _id: catId }, { $set: { productCount: count } });
  return count;
}

/**
 * Recalculates and updates product counts for a category and all its parent/ancestor categories.
 */
export async function updateCategoryProductCounts(
  categoryId: mongoose.Types.ObjectId | string | null | undefined,
): Promise<void> {
  if (!categoryId) return;
  const catId = typeof categoryId === 'string' ? new mongoose.Types.ObjectId(categoryId) : categoryId;

  const category = await Category.findById(catId).lean();
  if (!category) return;

  const categoryIds = [catId, ...category.ancestors.map((a) => a._id)];
  for (const id of categoryIds) {
    await recalculateCategoryProductCount(id);
  }
}

// ---------- Service functions ----------

/**
 * Create a new category.
 */
export async function createCategory(data: CreateCategoryInput) {
  // Build ancestors and validate depth
  const { ancestors, level } = await buildCategoryAncestors(data.parentId ?? null);

  // Generate slug
  const slug = await generateCategorySlug(data.name);

  const category = new Category({
    name: data.name,
    slug,
    parentId: data.parentId || null,
    ancestors,
    level,
    description: data.description ?? undefined,
    image: data.image ?? undefined,
    isActive: data.isActive ?? true,
    isFeatured: data.isFeatured ?? false,
    sortOrder: data.sortOrder ?? 0,
    metadata: data.metadata ?? {},
  });

  await category.save();
  return category.toObject();
}

/**
 * List categories (flat, paginated, admin view).
 */
export async function listCategories(opts: PaginationOpts) {
  const { page, limit, search } = opts;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const [categories, total] = await Promise.all([
    Category.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Category.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: categories,
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
 * Get a single category by ID.
 */
export async function getCategoryById(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid category ID');
  }

  const category = await Category.findById(id).lean();
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  return category;
}

/**
 * Update a category.
 */
export async function updateCategory(id: string, data: UpdateCategoryInput) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid category ID');
  }

  const category = await Category.findById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  const oldParentId = category.parentId;
  const oldActive = category.isActive;

  // If parentId is changing, validate depth
  if (data.parentId !== undefined && String(data.parentId) !== String(category.parentId)) {
    if (data.parentId) {
      // Can't be own parent
      if (data.parentId === id) {
        throw new ValidationError('Category cannot be its own parent');
      }

      const newParent = await Category.findById(data.parentId);
      if (!newParent) {
        throw new NotFoundError('New parent category not found');
      }

      // Check we're not creating a cycle
      const isDescendant = newParent.ancestors.some(
        (a: ICategoryAncestor) => String(a._id) === id,
      );
      if (isDescendant) {
        throw new ValidationError('Cannot move a category under its own descendant');
      }

      if (newParent.level >= APP_CONFIG.MAX_CATEGORY_DEPTH - 1) {
        throw new ValidationError(
          `Maximum category depth of ${APP_CONFIG.MAX_CATEGORY_DEPTH} levels exceeded`,
        );
      }
    }

    category.parentId = data.parentId
      ? new mongoose.Types.ObjectId(data.parentId)
      : null;

    // Rebuild ancestors now that parentId changed
    const { ancestors, level } = await buildCategoryAncestors(category.parentId);
    category.ancestors = ancestors;
    category.level = level;
  }

  if (data.name !== undefined) {
    category.name = data.name;
    // Regenerate slug when name changes
    category.slug = await generateCategorySlug(data.name, category._id as mongoose.Types.ObjectId);
  }
  if (data.description !== undefined) category.description = data.description ?? undefined;
  if (data.image !== undefined) category.image = data.image ?? undefined;
  if (data.isActive !== undefined) category.isActive = data.isActive;
  if (data.isFeatured !== undefined) category.isFeatured = data.isFeatured;
  if (data.sortOrder !== undefined) category.sortOrder = data.sortOrder;
  if (data.metadata !== undefined) {
    category.metadata = {
      metaTitle: data.metadata.metaTitle ?? undefined,
      metaDescription: data.metadata.metaDescription ?? undefined,
    };
  }

  await category.save();

  // If parentId changed, update children's ancestors
  if (data.parentId !== undefined) {
    await updateChildrenAncestors(category);
  }

  // Trigger product count recalculations on parent chain modifications
  const parentChanged = String(category.parentId) !== String(oldParentId);
  const activeChanged = category.isActive !== oldActive;

  if (parentChanged) {
    if (oldParentId) {
      await updateCategoryProductCounts(oldParentId);
    }
    if (category.parentId) {
      await updateCategoryProductCounts(category.parentId);
    }
  } else if (activeChanged) {
    if (category.parentId) {
      await updateCategoryProductCounts(category.parentId);
    }
  }

  return category.toObject();
}

/**
 * Recursively update ancestors of all children when a parent moves.
 */
async function updateChildrenAncestors(parent: ICategoryDocument) {
  const children = await Category.find({ parentId: parent._id });

  for (const child of children) {
    const { ancestors, level } = await buildCategoryAncestors(parent._id as mongoose.Types.ObjectId);
    child.ancestors = ancestors;
    child.level = level;
    await child.save();
    await updateChildrenAncestors(child);
  }
}

/**
 * Soft-delete a category.
 */
export async function deleteCategory(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid category ID');
  }

  const category = await Category.findById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Check no active products reference this category
  const Product = mongoose.model('Product');
  const activeProductCount = await Product.countDocuments({
    categoryId: new mongoose.Types.ObjectId(id),
    deletedAt: null,
    isActive: true,
  });

  if (activeProductCount > 0) {
    throw new ConflictError(
      `Cannot delete category with ${activeProductCount} active products. Reassign or deactivate products first.`,
    );
  }

  // Check no child categories
  const childCount = await Category.countDocuments({ parentId: new mongoose.Types.ObjectId(id) });
  if (childCount > 0) {
    throw new ConflictError(
      `Cannot delete category with ${childCount} subcategories. Delete or move subcategories first.`,
    );
  }

  // Check no category has this category in their ancestors list (prevents orphaned ancestor references)
  const referringCategories = await Category.countDocuments({
    'ancestors._id': category._id,
  });
  if (referringCategories > 0) {
    throw new ConflictError(
      `Cannot delete category as it is still referenced in the ancestors list of ${referringCategories} category/categories.`,
    );
  }

  // Hard delete the category
  await Category.deleteOne({ _id: category._id });

  return { deleted: true };
}

/**
 * Build a nested category tree (storefront, active only).
 */
export async function getCategoryTree() {
  const categories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  // Build tree from flat array
  const map = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  for (const cat of categories) {
    const node: CategoryTreeNode = {
      _id: String(cat._id),
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      sortOrder: cat.sortOrder,
      productCount: cat.productCount,
      children: [],
    };
    map.set(String(cat._id), node);
  }

  for (const cat of categories) {
    const node = map.get(String(cat._id))!;
    if (cat.parentId) {
      const parentNode = map.get(String(cat.parentId));
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        // Parent not in active set, treat as root
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/**
 * Get category by slug with children and breadcrumb (storefront).
 */
export async function getCategoryBySlug(slug: string): Promise<Record<string, unknown>> {
  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Get children
  const children = await Category.find({
    parentId: category._id,
    isActive: true,
  })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  // Breadcrumb from ancestors + self
  const breadcrumb = [
    ...category.ancestors.map((a: ICategoryAncestor) => ({
      _id: String(a._id),
      name: a.name,
      slug: a.slug,
    })),
    {
      _id: String(category._id),
      name: category.name,
      slug: category.slug,
    },
  ];

  return {
    ...category,
    children,
    breadcrumb,
  };
}
