"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueChart } from "@/components/admin/dashboard/revenue-chart";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenuePaise: number;
  totalCustomers: number;
  lowStockCount: number;
  revenueByMonth: {
    month: string;
    year: number;
    totalPaise: number;
  }[];
}

interface RecentOrder {
  _id: string;
  orderNumber?: string;
  customerName?: string;
  totalPaise: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.get<DashboardStats>("/api/v1/admin/dashboard/stats"),
          api.get<RecentOrder[]>("/api/v1/admin/dashboard/recent-orders"),
        ]);
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (ordersRes.success && ordersRes.data) setRecentOrders(ordersRes.data);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = stats
    ? [
        { title: "Total Revenue", value: formatPrice(stats.totalRevenuePaise), icon: DollarSign },
        { title: "Total Orders", value: stats.totalOrders.toLocaleString(), icon: ShoppingCart },
        { title: "Products", value: stats.totalProducts.toLocaleString(), icon: Package },
        { title: "Customers", value: stats.totalCustomers.toLocaleString(), icon: Users },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your store.
        </p>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-20 mt-2" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat) => (
              <Card key={stat.title} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Low Stock Alert */}
      {stats && stats.lowStockCount > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Low Stock Alert</p>
              <p className="text-xs text-muted-foreground">
                {stats.lowStockCount} products are running low on stock
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Revenue Chart + Recent Orders ─── */}
      <div className="grid gap-4 lg:grid-cols-7">
        <RevenueChart data={stats?.revenueByMonth ?? []} loading={loading} />

        {/* Recent Orders */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))
                : recentOrders.length === 0
                  ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No orders yet
                    </p>
                  )
                  : recentOrders.slice(0, 5).map((order) => (
                    <div key={order._id} className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {order.orderNumber?.slice(-4) || order._id.slice(-4)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {order.customerName || "Customer"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatPrice(order.totalPaise)}</p>
                        <StatusBadge
                          tone={
                            order.status === "delivered"
                              ? "success"
                              : order.status === "cancelled" ||
                                  order.status === "refunded"
                                ? "danger"
                                : order.status === "pending"
                                  ? "warning"
                                  : "info"
                          }
                          className="text-[10px] mt-0.5 capitalize"
                        >
                          {order.status}
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
