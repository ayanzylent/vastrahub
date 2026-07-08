/**
 * Cart service — business logic for cart operations.
 * Supports both authenticated users and guest carts.
 */

import mongoose from 'mongoose';
import { Cart, Sku, Product } from '../../db/models/index.js';
import type { ICartDocument, ICartItem } from '../../db/models/index.js';
import type { IProductDocument, IVariantMedia, IMediaItem } from '../../db/models/index.js';
import { NotFoundError, ValidationError } from '../../lib/errors.js';
import { APP_CONFIG } from '../../constants/index.js';

// ---------- Interfaces ----------

export interface CartOwner {
  userId?: string;
  guestId?: string;
}

export interface AddItemInput {
  skuId: string;
  quantity: number;
}

// ---------- Helpers ----------

/**
 * Extract cover image URL from product's variantMedia.
 */
function getCoverImageUrl(product: IProductDocument): string | undefined {
  const coverGroup = product.variantMedia?.find((vm: IVariantMedia) => vm.isCoverGroup);
  if (!coverGroup || !coverGroup.media || coverGroup.media.length === 0) return undefined;
  const firstImage = coverGroup.media.find((m: IMediaItem) => m.type === 'image');
  return firstImage?.url ?? coverGroup.media[0]?.url;
}

/**
 * Prepare a cart document for saving.
 * Validates ownership, recalculates itemCount, and sets guest TTL.
 * Replaces the former Mongoose pre('save') hook on the Cart model.
 */
function prepareCartForSave(cart: ICartDocument): void {
  if (!cart.userId && !cart.guestId) {
    throw new ValidationError('Cart must have either userId or guestId');
  }

  // Auto-calculate itemCount
  cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  // Set TTL for guest carts
  if (cart.guestId && !cart.userId && !cart.expiresAt) {
    cart.expiresAt = new Date(
      Date.now() + APP_CONFIG.GUEST_CART_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
  }
}

// ---------- Service functions ----------

/**
 * Get or create a cart for the given owner.
 */
export async function getOrCreateCart(owner: CartOwner): Promise<ICartDocument> {
  if (!owner.userId && !owner.guestId) {
    throw new ValidationError('Either userId or guestId is required');
  }

  const filter: Record<string, unknown> = {};
  if (owner.userId) {
    filter.userId = new mongoose.Types.ObjectId(owner.userId);
  } else {
    filter.guestId = owner.guestId;
  }

  let cart = await Cart.findOne(filter) as ICartDocument | null;

  if (!cart) {
    cart = new Cart({
      userId: owner.userId ? new mongoose.Types.ObjectId(owner.userId) : null,
      guestId: owner.guestId ?? null,
      items: [],
      itemCount: 0,
    }) as ICartDocument;
    prepareCartForSave(cart);
    await cart.save();
  }

  return cart;
}

/**
 * Helper to dynamically enrich a cart document with live Product/SKU details.
 */
async function enrichCart(cart: ICartDocument) {
  const cartObj = cart.toObject();
  const enrichedItems: ICartItem[] = [];

  for (const item of cartObj.items) {
    const sku = await Sku.findById(item.skuId).lean();
    if (!sku) continue;

    const product = await Product.findById(item.productId).lean() as IProductDocument | null;
    if (!product) continue;

    const coverGroup = product.variantMedia?.find((vm) => vm.isCoverGroup);
    const firstImage = coverGroup?.media?.find((m) => m.type === 'image');
    const imageUrl = firstImage?.url ?? coverGroup?.media?.[0]?.url;

    let variantLabel = 'Default';
    if (sku.attributes) {
      const attrs = sku.attributes;
      if (attrs instanceof Map) {
        variantLabel = Array.from(attrs.values()).join(' / ') || 'Default';
      } else if (typeof attrs === 'object') {
        variantLabel = Object.values(attrs).join(' / ') || 'Default';
      }
    }

    enrichedItems.push({
      ...item,
      productName: product.name,
      skuCode: sku.sku,
      attributes: sku.attributes,
      imageUrl,
      pricePaise: sku.pricePaise,
      mrpPaise: sku.mrpPaise,
      variantLabel,
    });
  }

  cartObj.items = enrichedItems;
  return cartObj;
}

/**
 * Get cart with current data.
 */
export async function getCart(owner: CartOwner) {
  const cart = await getOrCreateCart(owner);
  return enrichCart(cart);
}

/**
 * Add an item to the cart.
 */
export async function addItem(owner: CartOwner, input: AddItemInput) {
  const { skuId, quantity } = input;

  if (!mongoose.Types.ObjectId.isValid(skuId)) {
    throw new ValidationError('Invalid SKU ID');
  }

  // Validate SKU exists and is active
  const sku = await Sku.findOne({
    _id: new mongoose.Types.ObjectId(skuId),
    isActive: true,
    deletedAt: null,
  });
  if (!sku) {
    throw new NotFoundError('SKU not found or not available');
  }

  // Check available stock
  const availableStock = sku.stockQuantity - sku.reservedQuantity;
  if (availableStock < quantity) {
    throw new ValidationError(
      `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`,
    );
  }

  // Get product for verification
  const product = await Product.findById(sku.productId).lean() as IProductDocument | null;
  if (!product || !product.isActive || product.deletedAt) {
    throw new NotFoundError('Product not found or not available');
  }

  const cart = await getOrCreateCart(owner);

  // Check max items
  const existingItemIdx = cart.items.findIndex(
    (item: ICartItem) => String(item.skuId) === skuId,
  );

  if (existingItemIdx === -1 && cart.items.length >= APP_CONFIG.MAX_CART_ITEMS) {
    throw new ValidationError(`Cart cannot have more than ${APP_CONFIG.MAX_CART_ITEMS} items`);
  }

  // Check max quantity per item
  if (quantity > APP_CONFIG.MAX_CART_ITEM_QTY) {
    throw new ValidationError(`Maximum quantity per item is ${APP_CONFIG.MAX_CART_ITEM_QTY}`);
  }

  if (existingItemIdx >= 0) {
    // Update existing item quantity
    const newQty = cart.items[existingItemIdx]!.quantity + quantity;
    if (newQty > APP_CONFIG.MAX_CART_ITEM_QTY) {
      throw new ValidationError(`Maximum quantity per item is ${APP_CONFIG.MAX_CART_ITEM_QTY}`);
    }
    if (newQty > availableStock) {
      throw new ValidationError(`Insufficient stock. Available: ${availableStock}`);
    }
    cart.items[existingItemIdx]!.quantity = newQty;
  } else {
    // Add new item
    cart.items.push({
      skuId: new mongoose.Types.ObjectId(skuId),
      productId: product._id as mongoose.Types.ObjectId,
      quantity,
      addedAt: new Date(),
    });
  }

  prepareCartForSave(cart);
  await cart.save();
  return enrichCart(cart);
}

/**
 * Update item quantity in cart.
 */
export async function updateItemQuantity(owner: CartOwner, skuId: string, quantity: number) {
  if (!mongoose.Types.ObjectId.isValid(skuId)) {
    throw new ValidationError('Invalid SKU ID');
  }

  if (quantity < 1 || quantity > APP_CONFIG.MAX_CART_ITEM_QTY) {
    throw new ValidationError(`Quantity must be between 1 and ${APP_CONFIG.MAX_CART_ITEM_QTY}`);
  }

  const cart = await getOrCreateCart(owner);

  const itemIdx = cart.items.findIndex(
    (item: ICartItem) => String(item.skuId) === skuId,
  );
  if (itemIdx === -1) {
    throw new NotFoundError('Item not found in cart');
  }

  // Validate stock
  const sku = await Sku.findOne({
    _id: new mongoose.Types.ObjectId(skuId),
    isActive: true,
    deletedAt: null,
  });
  if (!sku) {
    throw new NotFoundError('SKU not found or not available');
  }

  const availableStock = sku.stockQuantity - sku.reservedQuantity;
  if (quantity > availableStock) {
    throw new ValidationError(`Insufficient stock. Available: ${availableStock}`);
  }

  cart.items[itemIdx]!.quantity = quantity;

  prepareCartForSave(cart);
  await cart.save();
  return enrichCart(cart);
}

/**
 * Remove an item from cart.
 */
export async function removeItem(owner: CartOwner, skuId: string) {
  if (!mongoose.Types.ObjectId.isValid(skuId)) {
    throw new ValidationError('Invalid SKU ID');
  }

  const cart = await getOrCreateCart(owner);

  const itemIdx = cart.items.findIndex(
    (item: ICartItem) => String(item.skuId) === skuId,
  );
  if (itemIdx === -1) {
    throw new NotFoundError('Item not found in cart');
  }

  cart.items.splice(itemIdx, 1);
  prepareCartForSave(cart);
  await cart.save();
  return enrichCart(cart);
}

/**
 * Clear all items from cart.
 */
export async function clearCart(owner: CartOwner) {
  const cart = await getOrCreateCart(owner);
  cart.items = [] as unknown as ICartDocument['items'];
  cart.itemCount = 0;
  prepareCartForSave(cart);
  await cart.save();
  return enrichCart(cart);
}

/**
 * Merge guest cart into user cart.
 */
export async function mergeGuestCart(guestId: string, userId: string) {
  const guestCart = await Cart.findOne({ guestId }) as ICartDocument | null;
  if (!guestCart || guestCart.items.length === 0) {
    // Nothing to merge, just return user cart
    return getCart({ userId });
  }

  const userCart = await getOrCreateCart({ userId });

  // Merge items: if same skuId, keep higher quantity
  for (const guestItem of guestCart.items) {
    const existingIdx = userCart.items.findIndex(
      (item: ICartItem) => String(item.skuId) === String(guestItem.skuId),
    );

    if (existingIdx >= 0) {
      // Keep the higher quantity
      if (guestItem.quantity > userCart.items[existingIdx]!.quantity) {
        userCart.items[existingIdx]!.quantity = guestItem.quantity;
      }
    } else {
      // Check max items
      if (userCart.items.length < APP_CONFIG.MAX_CART_ITEMS) {
        userCart.items.push({
          skuId: guestItem.skuId,
          productId: guestItem.productId,
          quantity: guestItem.quantity,
          addedAt: guestItem.addedAt,
        } as ICartItem);
      }
    }
  }

  prepareCartForSave(userCart);
  await userCart.save();

  // Delete guest cart
  await Cart.deleteOne({ _id: guestCart._id });

  return enrichCart(userCart);
}

/**
 * Refresh prices helper - kept for legacy compatibility but performs dynamic enrichment.
 */
export async function refreshPrices(owner: CartOwner) {
  const cart = await getOrCreateCart(owner);
  const enriched = await enrichCart(cart);
  return { cart: enriched, changedItems: [] };
}
