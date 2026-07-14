/**
 * Admin dashboard service — aggregated stats and recent orders.
 */

import mongoose from 'mongoose';
import { Product, Order } from '../../db/models/index.js';

// ---------- Constants ----------

/** Orders excluded from revenue (unpaid or voided). */
const REVENUE_EXCLUDED_STATUSES = ['pending', 'cancelled', 'failed'] as const;

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

// ---------- Interfaces ----------

export interface RevenueByMonth {
  month: string;
  year: number;
  totalPaise: number;
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenuePaise: number;
  totalCustomers: number;
  lowStockCount: number;
  revenueByMonth: RevenueByMonth[];
}

export interface RecentOrderDto {
  _id: string;
  orderNumber: string;
  customerName: string;
  totalPaise: number;
  status: string;
  createdAt: Date;
}

// ---------- Helpers ----------

function revenueMatchFilter() {
  return { status: { $nin: [...REVENUE_EXCLUDED_STATUSES] } };
}

/**
 * Build last 12 calendar months (oldest → newest), merging aggregation results.
 */
function buildLast12Months(agg: { year: number; month: number; total: number }[]): RevenueByMonth[] {
  const now = new Date();
  const byKey = new Map(agg.map((r) => [`${r.year}-${r.month}`, r.total]));

  const result: RevenueByMonth[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const monthIndex = d.getMonth(); // 0-based
    const monthNum = monthIndex + 1;
    result.push({
      month: MONTH_LABELS[monthIndex],
      year,
      totalPaise: byKey.get(`${year}-${monthNum}`) ?? 0,
    });
  }
  return result;
}

// ---------- Service functions ----------

/**
 * Get dashboard stats.
 */
export async function getStats(): Promise<DashboardStats> {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const [
    totalProducts,
    totalOrders,
    revenueAgg,
    totalCustomers,
    lowStockCount,
    monthlyAgg,
  ] = await Promise.all([
    Product.countDocuments({ isActive: true, deletedAt: null }),

    Order.countDocuments({}),

    Order.aggregate([
      { $match: revenueMatchFilter() },
      { $group: { _id: null, total: { $sum: '$pricing.totalPaise' } } },
    ]),

    mongoose.connection.collection('user').countDocuments({
      $or: [{ role: 'customer' }, { role: { $exists: false } }, { role: null }],
    }),

    Product.countDocuments({
      isActive: true,
      deletedAt: null,
      totalStock: { $lt: 10, $gt: 0 },
    }),

    Order.aggregate([
      {
        $match: {
          ...revenueMatchFilter(),
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          total: { $sum: '$pricing.totalPaise' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  const totalRevenuePaise = revenueAgg[0]?.total ?? 0;

  const revenueByMonth = buildLast12Months(
    monthlyAgg.map((r: { _id: { year: number; month: number }; total: number }) => ({
      year: r._id.year,
      month: r._id.month,
      total: r.total,
    })),
  );

  return {
    totalProducts,
    totalOrders,
    totalRevenuePaise,
    totalCustomers,
    lowStockCount,
    revenueByMonth,
  };
}

/**
 * Get recent orders as a flat DTO for the admin dashboard.
 */
export async function getRecentOrders(limit: number = 10): Promise<RecentOrderDto[]> {
  const orders = await Order.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('orderNumber status pricing.totalPaise shippingAddress.fullName createdAt')
    .lean();

  return orders.map((order) => ({
    _id: String(order._id),
    orderNumber: order.orderNumber,
    customerName: order.shippingAddress?.fullName ?? 'Customer',
    totalPaise: order.pricing?.totalPaise ?? 0,
    status: order.status,
    createdAt: order.createdAt,
  }));
}
