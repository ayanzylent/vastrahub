/**
 * Checkout service — business logic for checkout flow.
 */

import mongoose from 'mongoose';
import { Order, Payment, Sku, Address } from '../../db/models/index.js';
import type { IOrderDocument, IPaymentDocument, IShippingAddress } from '../../db/models/index.js';
import { NotFoundError, ValidationError } from '../../lib/errors.js';
import { getRazorpay } from '../../lib/razorpay.js';
import { initiateIciciSale } from '../../lib/icici.js';
import { getConfig } from '../../config/env.js';
import { getCart, clearCart } from '../cart/cart.service.js';
import { generateOrderNumber, validateOrderPricing } from '../order/order.service.js';
// import { validateAndPreviewCoupon } from '../coupon/coupon.service.js';

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

    if (item.pricePaise !== sku.pricePaise) {
      priceChanges.push({
        skuId: String(item.skuId),
        oldPrice: item.pricePaise ?? sku.pricePaise,
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
  paymentMethod: 'razorpay' | 'icici' | 'cod';
  customerNotes?: string;
}

/**
 * Create a new order from the user's cart.
 */
export async function createOrder(userId: string, input: CreateOrderInput) {
  if (input.paymentMethod === 'razorpay') {
    throw new ValidationError('Razorpay payment method is temporarily disabled.');
  }

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

  // ── Coupon disabled: module not fully implemented ─────────────────
  // Bugs to fix when re-enabling:
  //   • Use atomic $inc for coupon usage (race condition with read-modify-write)
  //   • Reverse coupon usage when payment fails (stock is restored but usage isn't)
  //   • Handle totalPaise=0 case (100% discount fails Payment model min:1 validation)
  // Original code: validated coupon, calculated discount, built couponSnapshot.
  const discountPaise = 0;

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
      productName: item.productName,
      skuCode: item.skuCode,
      variantLabel,
      attributes: item.attributes,
      imageUrl: item.imageUrl,
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

  // Validate pricing before opening a transaction (pure in-memory check).
  validateOrderPricing({
    subtotalPaise,
    discountPaise,
    shippingPaise,
    taxPaise,
    totalPaise,
  });
  
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
    // couponSnapshot, // Coupon disabled — re-enable with coupon module
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
  let iciciOrderId: string | undefined;
  let iciciRedirectURI: string | undefined;
  const config = getConfig();

  /*
  if (input.paymentMethod === 'razorpay') {
    // Razorpay is temporarily disabled
    throw new ValidationError('Razorpay payment method is temporarily disabled.');
    const rzp = getRazorpay();
    const rzpOrder = await rzp.orders.create({
      amount: totalPaise,
      currency: 'INR',
      receipt: orderNumber,
    });

    razorpayOrderId = rzpOrder.id;
    payment.gatewayOrderId = razorpayOrderId;
  } else
  */
  if (input.paymentMethod === 'icici') {
    // Redirect (hosted-page) flow: ask ICICI to initiate the sale and hand us
    // the URL to send the buyer to.
    const iciciSale = await initiateIciciSale(totalPaise, orderNumber);
    iciciOrderId = iciciSale.merchantTxnNo;
    iciciRedirectURI = iciciSale.redirectURI;
    payment.gatewayOrderId = iciciOrderId;
    payment.webhookEvents.push({
      eventType: 'icici.initiated',
      payload: iciciSale.raw,
      receivedAt: new Date(),
    });
  } else if (input.paymentMethod === 'cod') {
    // Assign a unique gatewayOrderId so the compound unique index
    // (gatewayOrderId + gatewayName) doesn't collide on null for every COD order.
    payment.gatewayOrderId = `cod_${orderNumber}`;
    order.status = 'confirmed';
    order.statusHistory.push({
      status: 'confirmed',
      changedAt: new Date(),
      changedBy: 'system',
      note: 'COD order automatically confirmed',
    });
    payment.status = 'authorized';
  }

  // 13. Atomic: decrement stock + save order/payment inside a transaction.
  //     If any step fails (e.g. insufficient stock on SKU #3, save validation
  //     error), the entire transaction rolls back — no stock leaks.
  //     NOTE: Requires MongoDB replica set.
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    for (const item of validation.items) {
      const updatedSku = await Sku.findOneAndUpdate(
        { _id: item.skuId, stockQuantity: { $gte: item.quantity } },
        { $inc: { stockQuantity: -item.quantity } },
        { new: true, session },
      );
      if (!updatedSku) {
        throw new ValidationError(
          `Insufficient stock for SKU ${item.currentSku.sku} during checkout`,
        );
      }
    }

    await Promise.all([order.save({ session }), payment.save({ session })]);

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }

  // 14. Increment coupon usage — DISABLED (coupon module not complete)
  // BUG: Use atomic $inc, and reverse on payment failure.

  // 15. Clear cart
  await clearCart({ userId });

  // 16. Return result
  return {
    orderId: order._id,
    orderNumber,
    paymentId: payment._id,
    razorpayOrderId,
    razorpayKeyId: config.RAZORPAY_KEY_ID,
    iciciRedirectURI,
    totalPaise,
    paymentMethod: input.paymentMethod,
  };
}

interface BuyNowInput {
  skuId: string;
  quantity: number;
  addressId: string;
  couponCode?: string;
  paymentMethod: 'razorpay' | 'icici' | 'cod';
  customerNotes?: string;
}

/**
 * Create an order directly from a single SKU (Buy Now).
 * Bypasses the cart entirely.
 */
export async function createBuyNowOrder(userId: string, input: BuyNowInput) {
  if (input.paymentMethod === 'razorpay') {
    throw new ValidationError('Razorpay payment method is temporarily disabled.');
  }

  // 1. Validate SKU
  if (!mongoose.Types.ObjectId.isValid(input.skuId)) {
    throw new ValidationError('Invalid SKU ID');
  }

  const sku = await Sku.findOne({
    _id: new mongoose.Types.ObjectId(input.skuId),
    isActive: true,
    deletedAt: null,
  });
  if (!sku) {
    throw new NotFoundError('SKU not found or not available');
  }

  const availableStock = sku.stockQuantity - sku.reservedQuantity;
  if (availableStock < input.quantity) {
    throw new ValidationError(
      `Insufficient stock. Available: ${availableStock}, Requested: ${input.quantity}`,
    );
  }

  // 2. Get product for snapshot
  const { Product } = await import('../../db/models/index.js');
  const product = await Product.findById(sku.productId).lean();
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // 3. Get address
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

  // 4. Calculate pricing
  const subtotalPaise = sku.pricePaise * input.quantity;

  // ── Coupon disabled: module not fully implemented ─────────────────
  // See createOrder() for known bugs to fix when re-enabling.
  const discountPaise = 0;

  const shippingPaise = 0;
  const taxPaise = 0;
  const totalPaise = subtotalPaise - discountPaise + shippingPaise + taxPaise;

  if (totalPaise < 0) {
    throw new ValidationError('Total amount cannot be negative');
  }

  // 6. Generate order number
  const orderNumber = generateOrderNumber();

  // 7. Build variant label
  let variantLabel = 'Default';
  if (sku.attributes) {
    const attrs = sku.attributes;
    if (attrs instanceof Map) {
      variantLabel = Array.from(attrs.values()).join(' / ') || 'Default';
    } else if (typeof attrs === 'object') {
      variantLabel = Object.values(attrs).join(' / ') || 'Default';
    }
  }

  // Get cover image
  const coverGroup = product.variantMedia?.find((vm: any) => vm.isCoverGroup);
  const firstImage = coverGroup?.media?.find((m: any) => m.type === 'image');
  const imageUrl = firstImage?.url ?? coverGroup?.media?.[0]?.url;

  const orderItems = [{
    productId: sku.productId,
    skuId: sku._id,
    productName: product.name,
    skuCode: sku.sku,
    variantLabel,
    attributes: sku.attributes,
    imageUrl,
    quantity: input.quantity,
    pricePaise: sku.pricePaise,
    mrpPaise: sku.mrpPaise,
    totalPaise: sku.pricePaise * input.quantity,
    gstPercentage: 0,
    gstAmountPaise: 0,
  }];

  // 8. Build shipping address
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

  // 9. Create Order and Payment
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
    // couponSnapshot, // Coupon disabled — re-enable with coupon module
    shippingAddress,
    billingAddress: shippingAddress,
    status: 'pending',
    customerNotes: input.customerNotes,
    statusHistory: [{
      status: 'pending',
      changedAt: new Date(),
      changedBy: userId,
      note: 'Buy Now order created',
    }],
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

  // 10. Handle payment gateway
  let razorpayOrderId: string | undefined;
  let iciciOrderId: string | undefined;
  let iciciRedirectURI: string | undefined;
  const config = getConfig();

  /*
  if (input.paymentMethod === 'razorpay') {
    // Razorpay is temporarily disabled
    throw new ValidationError('Razorpay payment method is temporarily disabled.');
    const rzp = getRazorpay();
    const rzpOrder = await rzp.orders.create({
      amount: totalPaise,
      currency: 'INR',
      receipt: orderNumber,
    });
    razorpayOrderId = rzpOrder.id;
    payment.gatewayOrderId = razorpayOrderId;
  } else
  */
  if (input.paymentMethod === 'icici') {
    const iciciSale = await initiateIciciSale(totalPaise, orderNumber);
    iciciOrderId = iciciSale.merchantTxnNo;
    iciciRedirectURI = iciciSale.redirectURI;
    payment.gatewayOrderId = iciciOrderId;
    payment.webhookEvents.push({
      eventType: 'icici.initiated',
      payload: iciciSale.raw,
      receivedAt: new Date(),
    });
  } else if (input.paymentMethod === 'cod') {
    // Assign a unique gatewayOrderId so the compound unique index
    // (gatewayOrderId + gatewayName) doesn't collide on null for every COD order.
    payment.gatewayOrderId = `cod_${orderNumber}`;
    order.status = 'confirmed';
    order.statusHistory.push({
      status: 'confirmed',
      changedAt: new Date(),
      changedBy: 'system',
      note: 'COD order automatically confirmed',
    });
    payment.status = 'authorized';
  }

  // Validate pricing before opening a transaction (pure in-memory check).
  validateOrderPricing(order.pricing);

  // 11. Atomic: decrement stock + save order/payment inside a transaction.
  //     NOTE: Requires MongoDB replica set.
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const updatedSku = await Sku.findOneAndUpdate(
      { _id: sku._id, stockQuantity: { $gte: input.quantity } },
      { $inc: { stockQuantity: -input.quantity } },
      { new: true, session },
    );
    if (!updatedSku) {
      throw new ValidationError(`Insufficient stock for SKU ${sku.sku} during checkout`);
    }

    await Promise.all([order.save({ session }), payment.save({ session })]);

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }

  // 12. Increment coupon usage — DISABLED (coupon module not complete)
  // BUG: Use atomic $inc, and reverse on payment failure.

  return {
    orderId: order._id,
    orderNumber,
    paymentId: payment._id,
    razorpayOrderId,
    razorpayKeyId: config.RAZORPAY_KEY_ID,
    iciciRedirectURI,
    totalPaise,
    paymentMethod: input.paymentMethod,
  };
}
