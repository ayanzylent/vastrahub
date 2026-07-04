/**
 * Module route auto-registration.
 * Registers all module routes with the Fastify instance.
 */

import type { FastifyInstance } from 'fastify';
import healthRoutes from './health/health.route.js';
import categoryRoutes from './category/category.route.js';
import collectionRoutes from './collection/collection.route.js';
import productRoutes from './product/product.route.js';
import skuRoutes from './sku/sku.route.js';
import cartRoutes from './cart/cart.route.js';
import wishlistRoutes from './wishlist/wishlist.route.js';
import mediaRoutes from './media/media.route.js';
import userRoutes from './user/user.route.js';
import dashboardRoutes from './dashboard/dashboard.route.js';
import adminUsersRoutes from './admin-users/admin-users.route.js';
import authRoutes from './auth/auth.route.js';
import couponRoutes from './coupon/coupon.route.js';
import orderRoutes from './order/order.route.js';
import reviewRoutes from './review/review.route.js';
import checkoutRoutes from './checkout/checkout.route.js';
import paymentRoutes from './payment/payment.route.js';

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  // Health check
  await fastify.register(healthRoutes);

  // API modules
  await fastify.register(categoryRoutes);
  await fastify.register(collectionRoutes);
  await fastify.register(productRoutes);
  await fastify.register(skuRoutes);
  await fastify.register(cartRoutes);
  await fastify.register(wishlistRoutes);
  await fastify.register(mediaRoutes);
  await fastify.register(userRoutes);
  await fastify.register(dashboardRoutes);
  await fastify.register(adminUsersRoutes);
  await fastify.register(authRoutes);
  await fastify.register(couponRoutes);
  await fastify.register(orderRoutes);
  await fastify.register(reviewRoutes);
  await fastify.register(checkoutRoutes);
  await fastify.register(paymentRoutes);
}
