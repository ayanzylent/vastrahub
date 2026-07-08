"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { getMediaUrl } from "@/lib/media";
import { toast } from "sonner";
import type { IOrder } from "@/types";
import { ShoppingBag, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/account/order-status-badge";

function formatDate(value?: string | Date): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadOrders() {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await api.paginated<IOrder>(
        `/api/v1/orders?page=${page}&limit=10`
      );
      if (!active) return;

      if (res.success) {
        setOrders((prev) => (page === 1 ? res.data : [...prev, ...res.data]));
        setTotalPages(res.pagination.totalPages);
      } else {
        toast.error("Failed to load orders");
      }
      setLoading(false);
      setLoadingMore(false);
    }
    loadOrders();
    return () => {
      active = false;
    };
  }, [page]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <h3 className="font-heading text-lg font-semibold">No orders yet</h3>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">
            Start shopping to see your order history here.
          </p>
          <Button asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Order History</h2>
        <p className="text-sm text-muted-foreground">
          View and manage your past orders.
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const previewItems = order.items.slice(0, 4);
          const extraCount = order.items.length - previewItems.length;
          return (
            <Card key={order._id} className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="font-semibold break-all">{order.orderNumber}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold text-primary">
                      {formatPrice(order.pricing.totalPaise)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-3">
                  <div className="flex -space-x-2">
                    {previewItems.map((item) => (
                      <div
                        key={item.skuId}
                        className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md border-2 border-card bg-muted"
                      >
                        {item.imageUrl ? (
                          <Image
                            src={getMediaUrl(item.imageUrl)}
                            alt={item.productName}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-primary/30">
                            {item.productName[0]}
                          </div>
                        )}
                      </div>
                    ))}
                    {extraCount > 0 && (
                      <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-md border-2 border-card bg-muted text-xs font-medium text-muted-foreground">
                        +{extraCount}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.items.length}{" "}
                    {order.items.length === 1 ? "item" : "items"}
                  </p>

                  <Button asChild variant="outline" size="sm" className="ml-auto gap-1">
                    <Link href={`/account/orders/${order._id}`}>
                      View Details
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {page < totalPages && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={loadingMore}
          >
            {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
