/**
 * Admin dashboard service — aggregated stats and recent orders.
 */

import mongoose from 'mongoose';
import { Product, Order, Sku } from '../../db/models/index.js';

// ---------- Interfaces ----------

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenuePaise: number;
  totalCustomers: number;
  lowStockProducts: number;
}

// ---------- Service functions ----------

/**
 * Get dashboard stats.
 */
export async function getStats(): Promise<DashboardStats> {
  const [
    totalProducts,
    totalOrders,
    revenueAgg,
    totalCustomers,
    lowStockProducts,
  ] = await Promise.all([
    // Active products count
    Product.countDocuments({ isActive: true, deletedAt: null }),

    // Total orders count
    Order.countDocuments({}),

    // Total revenue from delivered orders
    Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$pricing.totalPaise' } } },
    ]),

    // Total customers (users with role=customer from Better-Auth users collection)
    mongoose.connection.collection('user').countDocuments({ role: { $in: ['customer', null] } }),

    // Products with low stock (totalStock < 10 and active)
    Product.countDocuments({
      isActive: true,
      deletedAt: null,
      totalStock: { $lt: 10, $gt: 0 },
    }),
  ]);

  const totalRevenuePaise = revenueAgg[0]?.total ?? 0;

  return {
    totalProducts,
    totalOrders,
    totalRevenuePaise,
    totalCustomers,
    lowStockProducts,
  };
}

/**
 * Get recent orders.
 */
export async function getRecentOrders(limit: number = 10) {
  const orders = await Order.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('orderNumber userId status pricing.totalPaise items createdAt')
    .lean();

  return orders;
}
