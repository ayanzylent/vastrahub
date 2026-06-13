/**
 * Wishlist service — business logic for wishlist operations.
 * Product-level wishlist (no SKU association).
 */

import mongoose from 'mongoose';
import { Wishlist, Product } from '../../db/models/index.js';
import type { IWishlistDocument, IWishlistItem } from '../../db/models/index.js';
import type { IProductDocument, IVariantMedia, IMediaItem } from '../../db/models/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../../lib/errors.js';
import { APP_CONFIG } from '@vastrahub/shared-constants';

// ---------- Helpers ----------

/**
 * Extract cover image URL from product's variantMedia.
 */
function getCoverImageUrl(product: Record<string, unknown>): string | undefined {
  const variantMedia = product.variantMedia as IVariantMedia[] | undefined;
  if (!variantMedia) return undefined;
  const coverGroup = variantMedia.find((vm) => vm.isCoverGroup);
  if (!coverGroup || !coverGroup.media || coverGroup.media.length === 0) return undefined;
  const firstImage = coverGroup.media.find((m: IMediaItem) => m.type === 'image');
  return firstImage?.url ?? coverGroup.media[0]?.url;
}

// ---------- Service functions ----------

/**
 * Get wishlist with populated product data.
 */
export async function getWishlist(userId: string) {
  let wishlist = await Wishlist.findOne({
    userId: new mongoose.Types.ObjectId(userId),
  }).lean() as (IWishlistDocument & { _id: mongoose.Types.ObjectId }) | null;

  if (!wishlist) {
    // Create empty wishlist
    const newWishlist = new Wishlist({
      userId: new mongoose.Types.ObjectId(userId),
      items: [],
    });
    await newWishlist.save();
    wishlist = newWishlist.toObject() as IWishlistDocument & { _id: mongoose.Types.ObjectId };
  }

  // Populate product info for each item
  const productIds = wishlist.items.map((item: IWishlistItem) => item.productId);
  const products = await Product.find({
    _id: { $in: productIds },
  })
    .select('name slug basePricePaise baseMrpPaise variantMedia isActive')
    .lean();

  const productMap = new Map(
    products.map((p) => [String(p._id), p]),
  );

  const items = wishlist.items
    .map((item: IWishlistItem) => {
      const product = productMap.get(String(item.productId));
      if (!product) return null;
      return {
        productId: String(item.productId),
        addedAt: item.addedAt,
        product: {
          _id: String(product._id),
          name: product.name,
          slug: product.slug,
          basePricePaise: product.basePricePaise,
          baseMrpPaise: product.baseMrpPaise,
          coverImage: getCoverImageUrl(product as unknown as Record<string, unknown>),
          isActive: product.isActive,
        },
      };
    })
    .filter(Boolean);

  return {
    _id: String(wishlist._id),
    userId: String(wishlist.userId),
    items,
  };
}

/**
 * Add a product to wishlist.
 */
export async function addItem(userId: string, productId: string) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ValidationError('Invalid product ID');
  }

  // Validate product exists and is active
  const product = await Product.findOne({
    _id: new mongoose.Types.ObjectId(productId),
    isActive: true,
    deletedAt: null,
  }).lean();

  if (!product) {
    throw new NotFoundError('Product not found or not active');
  }

  let wishlist = await Wishlist.findOne({
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!wishlist) {
    wishlist = new Wishlist({
      userId: new mongoose.Types.ObjectId(userId),
      items: [],
    }) as IWishlistDocument;
  }

  // Check duplicate
  const isDuplicate = wishlist.items.some(
    (item: IWishlistItem) => String(item.productId) === productId,
  );
  if (isDuplicate) {
    throw new ConflictError('Product is already in wishlist');
  }

  // Check max items
  if (wishlist.items.length >= APP_CONFIG.MAX_WISHLIST_ITEMS) {
    throw new ValidationError(`Wishlist cannot have more than ${APP_CONFIG.MAX_WISHLIST_ITEMS} items`);
  }

  wishlist.items.push({
    productId: new mongoose.Types.ObjectId(productId),
    addedAt: new Date(),
  });

  await wishlist.save();
  return { added: true, productId };
}

/**
 * Remove a product from wishlist.
 */
export async function removeItem(userId: string, productId: string) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ValidationError('Invalid product ID');
  }

  const wishlist = await Wishlist.findOne({
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!wishlist) {
    throw new NotFoundError('Wishlist not found');
  }

  const itemIdx = wishlist.items.findIndex(
    (item: IWishlistItem) => String(item.productId) === productId,
  );

  if (itemIdx === -1) {
    throw new NotFoundError('Product not found in wishlist');
  }

  wishlist.items.splice(itemIdx, 1);
  await wishlist.save();

  return { removed: true, productId };
}
