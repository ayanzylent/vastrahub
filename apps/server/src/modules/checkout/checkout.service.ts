/**
 * Checkout service — business logic for checkout flow.
 */

import mongoose from 'mongoose';
import { Order, Payment, Sku, Address, Coupon } from '../../db/models/index.js';
import type { IOrderDocument, IPaymentDocument, IShippingAddress } from '../../db/models/index.js';
import { NotFoundError, ValidationError } from '../../lib/errors.js';
import { getRazorpay } from '../../lib/razorpay.js';
import { getConfig } from '../../config/env.js';
import { getCart, clearCart } from '../cart/cart.service.js';
import { generateOrderNumber, validateOrderPricing } from '../order/order.service.js';
import { validateAndPreviewCoupon } from '../coupon/coupon.service.js';

/**
 * Validate cart for checkout.
 * Checks stock and price changes.
 */
export async function validateCart(userId: string) {
  const cart = await getCart({ userId });

  if (!cart.items || cart.items.length === 0) {
    throw new ValidationError('Cart is empty');
  }

  let subtotalPaise = 0;
  const priceChanges: Array<{ skuId: string; oldPrice: number; newPrice: number }> = [];
  const outOfStockItems: Array<{ skuId: string; available: number; requested: number }> = [];
  const enrichedItems = [];

  for (const item of cart.items) {
    const sku = await Sku.findById(item.skuId).lean();
    
    if (!sku || !sku.isActive || sku.deletedAt) {
      outOfStockItems.push({ skuId: String(item.skuId), available: 0, requested: item.quantity });
      continue;
    }

    const availableStock = sku.stockQuantity - sku.reservedQuantity;
    if (availableStock < item.quantity) {
      outOfStockItems.push({ skuId: String(item.skuId), available: availableStock, requested: item.quantity });
    }

    if (item.snapshot.pricePaise !== sku.pricePaise) {
      priceChanges.push({
        skuId: String(item.skuId),
        oldPrice: item.snapshot.pricePaise,
        newPrice: sku.pricePaise,
      });
    }

    subtotalPaise += sku.pricePaise * item.quantity;

    enrichedItems.push({
      ...item,
      currentSku: sku,
    });
  }

  return {
    valid: priceChanges.length === 0 && outOfStockItems.length === 0,
    items: enrichedItems,
    subtotalPaise,
    priceChanges,
    outOfStockItems,
  };
}

interface CreateOrderInput {
  addressId: string;
  couponCode?: string;
  paymentMethod: 'razorpay' | 'cod';
  customerNotes?: string;
}

/**
 * Create a new order from the user's cart.
 */
export async function createOrder(userId: string, input: CreateOrderInput) {
  // 1. Validate cart
  const validation = await validateCart(userId);
  if (!validation.valid) {
    throw new ValidationError('Cart validation failed. Items may be out of stock or prices may have changed.', 'CART_INVALID', {
      priceChanges: validation.priceChanges,
      outOfStockItems: validation.outOfStockItems,
    });
  }

  // 2. Get address
  if (!mongoose.Types.ObjectId.isValid(input.addressId)) {
    throw new ValidationError('Invalid address ID');
  }
  const address = await Address.findOne({
    _id: new mongoose.Types.ObjectId(input.addressId),
    userId: new mongoose.Types.ObjectId(userId),
  }).lean();

  if (!address) {
    throw new NotFoundError('Address not found');
  }

  // 3. Apply coupon
  let discountPaise = 0;
  let couponSnapshot;
  let couponDoc;

  if (input.couponCode) {
    const productIds = validation.items.map(item => String(item.productId));
    const couponResult = await validateAndPreviewCoupon(
      input.couponCode,
      validation.subtotalPaise,
      userId,
      productIds
    );

    if (!couponResult.valid) {
      throw new ValidationError(couponResult.message || 'Invalid coupon');
    }

    discountPaise = couponResult.discountAmountPaise || 0;
    couponDoc = await Coupon.findById(couponResult.couponId);
    if (couponDoc) {
      couponSnapshot = {
        code: couponDoc.code,
        discountType: couponDoc.discountType,
        fixedAmountPaise: couponDoc.fixedAmountPaise,
        discountAmountPaise: discountPaise,
      } as any;
      if (couponDoc.percentageValue !== undefined && couponDoc.percentageValue !== null) {
        couponSnapshot.percentageValue = couponDoc.percentageValue;
      }
    }
  }

  // 4. Calculate pricing
  const subtotalPaise = validation.subtotalPaise;
  const shippingPaise = 0; // Free shipping for now
  const taxPaise = 0; // GST included in price for now
  const totalPaise = subtotalPaise - discountPaise + shippingPaise + taxPaise;

  if (totalPaise < 0) {
    throw new ValidationError('Total amount cannot be negative');
  }

  // 5. Generate order number
  const orderNumber = generateOrderNumber();

  // 6. Build order items
  const orderItems = validation.items.map(item => {
    // Determine variant label from attributes
    let variantLabel = 'Default';
    if (item.currentSku.attributes) {
      const attrs = item.currentSku.attributes;
      if (attrs instanceof Map) {
        variantLabel = Array.from(attrs.values()).join(' / ') || 'Default';
      } else if (typeof attrs === 'object') {
        variantLabel = Object.values(attrs).join(' / ') || 'Default';
      }
    }

    return {
      productId: item.productId,
      skuId: item.skuId,
      productName: item.snapshot.productName,
      skuCode: item.snapshot.skuCode,
      variantLabel,
      attributes: item.snapshot.attributes,
      imageUrl: item.snapshot.imageUrl,
      quantity: item.quantity,
      pricePaise: item.currentSku.pricePaise,
      mrpPaise: item.currentSku.mrpPaise,
      totalPaise: item.currentSku.pricePaise * item.quantity,
      gstPercentage: 0,
      gstAmountPaise: 0,
    };
  });

  // 7. Build shipping address
  const shippingAddress: IShippingAddress = {
    fullName: address.fullName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: 'India',
  };

  // Start a mongoose session for atomicity if possible, but we'll do it sequentially for now
  
  // 8 & 9. Create Order and Payment
  const order = new Order({
    orderNumber,
    userId: new mongoose.Types.ObjectId(userId),
    items: orderItems,
    pricing: {
      subtotalPaise,
      discountPaise,
      shippingPaise,
      taxPaise,
      totalPaise,
    },
    couponSnapshot,
    shippingAddress,
    billingAddress: shippingAddress,
    status: 'pending',
    customerNotes: input.customerNotes,
    statusHistory: [{
      status: 'pending',
      changedAt: new Date(),
      changedBy: userId,
      note: 'Order created',
    }]
  }) as IOrderDocument;

  const payment = new Payment({
    orderId: order._id,
    amountPaise: totalPaise,
    currency: 'INR',
    gatewayName: input.paymentMethod,
    status: 'created',
    method: input.paymentMethod === 'cod' ? 'cod' : undefined,
  }) as IPaymentDocument;

  order.paymentId = payment._id as mongoose.Types.ObjectId;

  // 11 & 12. Handle payment gateway specifics
  let razorpayOrderId: string | undefined;
  const config = getConfig();

  if (input.paymentMethod === 'razorpay') {
    const rzp = getRazorpay();
    const rzpOrder = await rzp.orders.create({
      amount: totalPaise,
      currency: 'INR',
      receipt: orderNumber,
    });
    
    razorpayOrderId = rzpOrder.id;
    payment.gatewayOrderId = razorpayOrderId;
  } else if (input.paymentMethod === 'cod') {
    order.status = 'confirmed';
    order.statusHistory.push({
      status: 'confirmed',
      changedAt: new Date(),
      changedBy: 'system',
      note: 'COD order automatically confirmed',
    });
    payment.status = 'authorized';
  }

  // 13. Decrement stock
  for (const item of validation.items) {
    const updatedSku = await Sku.findOneAndUpdate(
      { _id: item.skuId, stockQuantity: { $gte: item.quantity } },
      { $inc: { stockQuantity: -item.quantity } },
      { new: true }
    );
    
    if (!updatedSku) {
      // Rollback is manual here without transactions
      throw new ValidationError(`Insufficient stock for SKU ${item.currentSku.sku} during checkout`);
    }
  }

  // Validate pricing before saving
  validateOrderPricing(order.pricing);

  // Save docs
  await Promise.all([order.save(), payment.save()]);

  // 14. Increment coupon usage
  if (couponDoc) {
    couponDoc.currentUses = (couponDoc.currentUses || 0) + 1;
    await couponDoc.save();
  }

  // 15. Clear cart
  await clearCart({ userId });

  // 16. Return result
  return {
    orderId: order._id,
    orderNumber,
    paymentId: payment._id,
    razorpayOrderId,
    razorpayKeyId: config.RAZORPAY_KEY_ID,
    totalPaise,
    paymentMethod: input.paymentMethod,
  };
}
