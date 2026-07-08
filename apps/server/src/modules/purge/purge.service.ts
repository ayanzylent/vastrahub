/**
 * Purge service — hard-deletes soft-deleted products (and cascaded data)
 * whose deletedAt exceeds the retention window.
 *
 * Designed to be called via an admin API endpoint (triggered by external cron).
 */

import mongoose from 'mongoose';
import { Product, Sku, Review, Wishlist, Collection } from '../../db/models/index.js';
import { APP_CONFIG } from '../../constants/index.js';

// ---------- Interfaces ----------

export interface PurgeOptions {
  /** Days to retain soft-deleted products before purging. Default: APP_CONFIG.SOFT_DELETE_RETENTION_DAYS */
  retentionDays?: number;
  /** If true, only report what would be deleted — don't actually delete. Default: false */
  dryRun?: boolean;
}

export interface PurgeResult {
  dryRun: boolean;
  retentionDays: number;
  cutoffDate: Date;
  productsDeleted: number;
  skusDeleted: number;
  reviewsDeleted: number;
  wishlistItemsRemoved: number;
  collectionRefsRemoved: number;
}

// ---------- Main purge function ----------

/**
 * Hard-delete all soft-deleted products whose `deletedAt` is older than the retention window,
 * along with their cascaded data (SKUs, reviews, wishlist refs, collection refs).
 *
 * Orders are NOT affected — they snapshot all product/SKU data at checkout time.
 */
export async function purgeDeletedProducts(options?: PurgeOptions): Promise<PurgeResult> {
  const retentionDays = options?.retentionDays ?? APP_CONFIG.SOFT_DELETE_RETENTION_DAYS;
  const dryRun = options?.dryRun ?? false;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  // Find products whose soft-delete date is older than the retention window.
  // Explicitly set `deletedAt: { $lte: cutoffDate, $ne: null }` so the soft-delete
  // plugin sees `deletedAt` in the filter and does NOT add its own `deletedAt: null`.
  const expiredProducts = await Product.find({
    deletedAt: { $lte: cutoffDate, $ne: null },
  }).select('_id name').lean();

  const result: PurgeResult = {
    dryRun,
    retentionDays,
    cutoffDate,
    productsDeleted: 0,
    skusDeleted: 0,
    reviewsDeleted: 0,
    wishlistItemsRemoved: 0,
    collectionRefsRemoved: 0,
  };

  if (expiredProducts.length === 0) {
    return result;
  }

  const productIds = expiredProducts.map((p) => p._id as mongoose.Types.ObjectId);

  if (dryRun) {
    // Dry run: count what WOULD be deleted without actually deleting
    const [skuCount, reviewCount, wishlistCount, collectionCount] = await Promise.all([
      Sku.countDocuments({ productId: { $in: productIds }, deletedAt: { $ne: null } }),
      Review.countDocuments({ productId: { $in: productIds } }),
      Wishlist.countDocuments({ 'items.productId': { $in: productIds } }),
      Collection.countDocuments({ productIds: { $in: productIds } }),
    ]);

    result.productsDeleted = expiredProducts.length;
    result.skusDeleted = skuCount;
    result.reviewsDeleted = reviewCount;
    result.wishlistItemsRemoved = wishlistCount;
    result.collectionRefsRemoved = collectionCount;

    return result;
  }

  // Live purge: delete in batch
  // 1. Hard-delete all SKUs (both soft-deleted and any remaining active ones)
  const skuResult = await Sku.deleteMany({
    productId: { $in: productIds },
    deletedAt: { $ne: null }, // bypass soft-delete plugin filter
  });
  result.skusDeleted = skuResult.deletedCount;

  // 2. Hard-delete all reviews for these products
  const reviewResult = await Review.deleteMany({
    productId: { $in: productIds },
  });
  result.reviewsDeleted = reviewResult.deletedCount;

  // 3. Remove from all wishlists
  const wishlistResult = await Wishlist.updateMany(
    { 'items.productId': { $in: productIds } },
    { $pull: { items: { productId: { $in: productIds } } } },
  );
  result.wishlistItemsRemoved = wishlistResult.modifiedCount;

  // 4. Remove from manual collections
  const collectionResult = await Collection.updateMany(
    { productIds: { $in: productIds } },
    { $pull: { productIds: { $in: productIds } } },
  );
  result.collectionRefsRemoved = collectionResult.modifiedCount;

  // 5. Hard-delete the products themselves
  await Product.deleteMany({
    _id: { $in: productIds },
    deletedAt: { $ne: null }, // bypass soft-delete plugin filter
  });
  result.productsDeleted = expiredProducts.length;

  return result;
}
