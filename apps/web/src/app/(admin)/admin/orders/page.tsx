"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Search, MoreHorizontal, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/shared/pagination";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { IOrder, PaginatedResponse } from "@vastrahub/shared-types";


interface AdminOrder extends Omit<IOrder, "paymentId"> {
  paymentId?: {
    _id: string;
    gatewayName: string;
    status: string;
    method?: string;
  };
}

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Return Requested", value: "return_requested" },
  { label: "Returned", value: "returned" },
  { label: "Failed", value: "failed" },
];

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Total ↑", value: "total_low" },
  { label: "Total ↓", value: "total_high" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (sortBy) params.set("sortBy", sortBy);

      const res = await api.get<PaginatedResponse<AdminOrder>>(
        `/api/v1/admin/orders?${params.toString()}`
      );
      const data = res as unknown as PaginatedResponse<AdminOrder>;
      if (data.success && data.data) {
        setOrders(data.data);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotal(data.pagination?.total ?? 0);
      } else {
        setOrders([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch {
      setOrders([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sortBy]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchOrders();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchOrders]);

  function getStatusTone(orderStatus: string): "success" | "warning" | "info" | "neutral" | "danger" {
    switch (orderStatus) {
      case "delivered":
      case "returned":
        return "success";
      case "pending":
      case "processing":
      case "return_requested":
        return "warning";
      case "confirmed":
      case "shipped":
        return "info";
      case "cancelled":
      case "failed":
        return "danger";
      default:
        return "neutral";
    }
  }

  function getGatewayBadge(gateway?: string) {
    if (!gateway) return <span className="text-muted-foreground text-xs">—</span>;
    if (gateway === "cod") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          COD
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
        {gateway}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Orders</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and track all customer orders
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number..."
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            
            <div className="flex gap-4">
              <select
                className="flex h-10 w-full md:w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                className="flex h-10 w-full md:w-[160px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Orders ({total})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/20">
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-12 mt-1" />
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-8 w-8 ml-auto" /></td>
                    </tr>
                  ))
                  : orders.map((order) => {
                    return (
                      <tr
                        key={order._id}
                        className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${order._id}`} className="block hover:underline">
                            <span className="text-sm font-medium text-primary block">
                              {order.orderNumber}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm hidden md:table-cell">
                          <span className="block font-medium">{order.shippingAddress?.fullName}</span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="block font-medium">
                            {formatPrice(order.pricing?.totalPaise ?? 0)}
                          </span>
                          <span className="text-xs text-muted-foreground block">
                            {order.items?.length || 0} item(s)
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {getGatewayBadge(order.paymentId?.gatewayName)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            tone={getStatusTone(order.status)}
                            className="text-[10px] uppercase font-semibold tracking-wider"
                          >
                            {order.status?.replace(/_/g, " ")}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/orders/${order._id}`}>
                                  <Eye className="h-4 w-4 mr-2" /> View Details
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {!loading && orders.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                <FileText className="h-12 w-12 opacity-20 mb-4" />
                <p className="text-sm">No orders found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
