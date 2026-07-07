/**
 * Review service — business logic for review operations.
 * Storefront: list approved reviews, rating stats.
 * Customer: create, update, delete own reviews.
 * Admin: list all, approve, flag, delete any review.
 */
import mongoose from 'mongoose';

const { ObjectId } = mongoose.Types;
import { Review, Order, Product } from '../../db/models/index.js';
import type { IReviewDocument, IReviewMediaItem, IOrderDocument } from '../../db/models/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../../lib/errors.js';

// ---------- Types ----------

export interface CreateReviewInput {
  productId: string;
  rating: number;
  title?: string;
  body?: string;
  media?: IReviewMediaItem[];
  orderId?: string;
}

export interface UpdateReviewInput {
  title?: string;
  body?: string;
  rating?: number;
  media?: IReviewMediaItem[];
}

// ---------- Helpers ----------

/**
 * Look up a user name from the Better-Auth users collection.
 * Better-auth stores users with native `_id` (ObjectId); there is no separate `id` field.
 */
async function getUserName(userId: string): Promise<string> {
  if (!ObjectId.isValid(userId)) return 'Unknown User';
  const usersCol = mongoose.connection.collection('user');
  const user = await usersCol.findOne(
    { _id: new ObjectId(userId) },
    { projection: { name: 1 } },
  );
  return (user?.name as string) ?? 'Unknown User';
}

/**
 * Bulk-fetch user names for a list of userIds.
 */
async function getUserNameMap(userIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(userIds)];
  const validObjectIds = uniqueIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  const usersCol = mongoose.connection.collection('user');
  const users = await usersCol
    .find({ _id: { $in: validObjectIds } }, { projection: { name: 1 } })
    .toArray();

  const map = new Map<string, string>();
  for (const u of users) {
    map.set(u._id.toString(), (u.name as string) ?? 'Unknown User');
  }
  return map;
}

// ---------- Storefront functions ----------

/**
 * List approved reviews for a product with pagination and sorting.
 * Returns user name alongside each review.
 */
export async function listProductReviews(
  productId: string,
  page: number,
  limit: number,
  sortBy?: string,
): Promise<{
  data: Array<Record<string, unknown>>;
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean };
}> {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ValidationError('Invalid product ID');
  }

  const pid = new mongoose.Types.ObjectId(productId);
  const skip = (page - 1) * limit;

  // Determine sort order
  let sort: Record<string, 1 | -1>;
  switch (sortBy) {
    case 'highest':
      sort = { rating: -1, createdAt: -1 };
      break;
    case 'lowest':
      sort = { rating: 1, createdAt: -1 };
      break;
    case 'newest':
    default:
      sort = { createdAt: -1 };
      break;
  }

  const filter = { productId: pid, isApproved: true };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  // Fetch user names for all reviews
  const userIds = reviews.map((r) => r.userId.toString());
  const nameMap = await getUserNameMap(userIds);

  const data = reviews.map((r) => ({
    ...r,
    userName: nameMap.get(r.userId.toString()) ?? 'Unknown User',
  }));

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
 * Get rating statistics for a product.
 * Returns average rating, total reviews, and rating distribution (1-5).
 */
export async function getReviewStats(productId: string) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ValidationError('Invalid product ID');
  }

  const pid = new mongoose.Types.ObjectId(productId);

  const aggregation = await Review.aggregate([
    {
      $match: {
        productId: pid,
        isApproved: true,
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
  ]);

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalReviews = 0;
  let ratingSum = 0;

  for (const bucket of aggregation) {
    const rating = bucket._id as number;
    const count = bucket.count as number;
    distribution[rating] = count;
    totalReviews += count;
    ratingSum += rating * count;
  }

  const averageRating =
    totalReviews > 0 ? Math.round((ratingSum / totalReviews) * 10) / 10 : 0;

  return {
    averageRating,
    totalReviews,
    distribution,
  };
}

// ---------- Customer functions ----------

/**
 * Create a review. One review per user per product (enforced by unique index).
 * If orderId is provided, verifies the order belongs to the user, is delivered,
 * and contains the product — then sets isVerifiedPurchase = true.
 */
export async function createReview(userId: string, data: CreateReviewInput) {
  if (!mongoose.Types.ObjectId.isValid(data.productId)) {
    throw new ValidationError('Invalid product ID');
  }

  const productOid = new mongoose.Types.ObjectId(data.productId);
  const userOid = new mongoose.Types.ObjectId(userId);

  // Check product exists
  const productExists = await Product.exists({ _id: productOid });
  if (!productExists) {
    throw new NotFoundError('Product not found');
  }

  // Check uniqueness: one review per user per product
  const existing = await Review.findOne({ productId: productOid, userId: userOid });
  if (existing) {
    throw new ConflictError('You have already reviewed this product');
  }

  let isVerifiedPurchase = false;

  // Verify order if orderId provided
  if (data.orderId) {
    if (!mongoose.Types.ObjectId.isValid(data.orderId)) {
      throw new ValidationError('Invalid order ID');
    }
    const orderOid = new mongoose.Types.ObjectId(data.orderId);

    const order = await Order.findOne({
      _id: orderOid,
      userId: userOid,
    }).lean() as IOrderDocument | null;

    if (!order) {
      throw new NotFoundError('Order not found or does not belong to you');
    }

    if (order.status !== 'delivered') {
      throw new ValidationError('Order must be delivered before you can leave a verified review');
    }

    // Check that order contains the product
    const hasProduct = order.items.some(
      (item: { productId: mongoose.Types.ObjectId }) =>
        item.productId.toString() === data.productId,
    );
    if (!hasProduct) {
      throw new ValidationError('This order does not contain the specified product');
    }

    isVerifiedPurchase = true;
  }

  const review = await Review.create({
    productId: productOid,
    userId: userOid,
    orderId: data.orderId ? new mongoose.Types.ObjectId(data.orderId) : undefined,
    rating: data.rating,
    title: data.title,
    body: data.body,
    media: data.media ?? [],
    isVerifiedPurchase,
    isApproved: false,
    isFlagged: false,
  });

  return review.toObject();
}

/**
 * Update own review. Resets isApproved to false (re-approval needed).
 */
export async function updateReview(
  userId: string,
  reviewId: string,
  data: UpdateReviewInput,
) {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new ValidationError('Invalid review ID');
  }

  const review = await Review.findOne({
    _id: new mongoose.Types.ObjectId(reviewId),
    userId: new mongoose.Types.ObjectId(userId),
  }) as IReviewDocument | null;

  if (!review) {
    throw new NotFoundError('Review not found');
  }

  if (data.title !== undefined) review.title = data.title;
  if (data.body !== undefined) review.body = data.body;
  if (data.rating !== undefined) review.rating = data.rating;
  if (data.media !== undefined) review.media = data.media;

  // Reset approval on edit
  review.isApproved = false;

  await review.save();
  return review.toObject();
}

/**
 * Recalculate a product's averageRating and reviewCount.
 * Must be called after hard-deleting a review (post-save hook only fires on save).
 */
async function recalculateProductReviewStats(productId: mongoose.Types.ObjectId) {
  const aggregation = await Review.aggregate([
    {
      $match: {
        productId,
        isApproved: true,
      },
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = aggregation[0] || { avgRating: 0, count: 0 };

  await Product.updateOne(
    { _id: productId },
    {
      $set: {
        averageRating: Math.round(stats.avgRating * 10) / 10,
        reviewCount: stats.count,
      },
    },
  );
}

/**
 * Hard-delete own review.
 */
export async function deleteReview(userId: string, reviewId: string) {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new ValidationError('Invalid review ID');
  }

  const review = await Review.findOne({
    _id: new mongoose.Types.ObjectId(reviewId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!review) {
    throw new NotFoundError('Review not found');
  }

  const productId = review.productId;
  await Review.deleteOne({ _id: review._id });

  // Recalculate product stats since post-save hook doesn't fire on deleteOne
  await recalculateProductReviewStats(productId);

  return { deleted: true };
}

// ---------- Admin functions ----------

/**
 * List all reviews with pagination and optional status/product filters.
 * Includes product name and user name.
 */
export async function listAllReviews(
  page: number,
  limit: number,
  status?: string,
  productId?: string,
): Promise<{
  data: Array<Record<string, unknown>>;
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean };
}> {
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};

  // Status filter
  if (status) {
    switch (status) {
      case 'pending':
        filter.isApproved = false;
        filter.isFlagged = false;
        break;
      case 'approved':
        filter.isApproved = true;
        break;
      case 'flagged':
        filter.isFlagged = true;
        break;
    }
  }

  // Product filter
  if (productId) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new ValidationError('Invalid product ID');
    }
    filter.productId = new mongoose.Types.ObjectId(productId);
  }

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  // Fetch product names
  const productIds = [...new Set(reviews.map((r) => r.productId.toString()))];
  const products = await Product.find(
    { _id: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) } },
    { name: 1 },
  ).lean();
  const productNameMap = new Map<string, string>();
  for (const p of products) {
    productNameMap.set(p._id.toString(), p.name);
  }

  // Fetch user names
  const userIds = reviews.map((r) => r.userId.toString());
  const userNameMap = await getUserNameMap(userIds);

  const data = reviews.map((r) => ({
    ...r,
    productName: productNameMap.get(r.productId.toString()) ?? 'Unknown Product',
    userName: userNameMap.get(r.userId.toString()) ?? 'Unknown User',
  }));

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
 * Approve a review — set isApproved=true, isFlagged=false.
 */
export async function approveReview(reviewId: string) {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new ValidationError('Invalid review ID');
  }

  const review = await Review.findById(reviewId) as IReviewDocument | null;
  if (!review) {
    throw new NotFoundError('Review not found');
  }

  review.isApproved = true;
  review.isFlagged = false;

  await review.save();
  return review.toObject();
}

/**
 * Flag a review — set isFlagged=true, isApproved=false.
 */
export async function flagReview(reviewId: string) {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new ValidationError('Invalid review ID');
  }

  const review = await Review.findById(reviewId) as IReviewDocument | null;
  if (!review) {
    throw new NotFoundError('Review not found');
  }

  review.isFlagged = true;
  review.isApproved = false;

  await review.save();
  return review.toObject();
}

/**
 * Admin hard-delete a review (no ownership check).
 */
export async function adminDeleteReview(reviewId: string) {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new ValidationError('Invalid review ID');
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new NotFoundError('Review not found');
  }

  const productId = review.productId;
  await Review.deleteOne({ _id: review._id });

  // Recalculate product stats since post-save hook doesn't fire on deleteOne
  await recalculateProductReviewStats(productId);

  return { deleted: true };
}
