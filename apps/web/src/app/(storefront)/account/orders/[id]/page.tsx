"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { getMediaUrl } from "@/lib/media";
import { toast } from "sonner";
import { OrderStatus, type IOrder } from "@/types";
import {
  ChevronLeft,
  MapPin,
  Loader2,
  PackageX,
  RotateCcw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderStatusBadge } from "@/components/storefront/account/order-status-badge";

const CANCELLABLE: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
];

function formatDate(value?: string | Date): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type ActionKind = "cancel" | "return" | null;

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = params.id;

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const [action, setAction] = useState<ActionKind>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadOrder() {
    setLoading(true);
    const res = await api.get<IOrder>(`/api/v1/orders/${orderId}`);
    if (res.success && res.data) {
      setOrder(res.data);
    } else {
      toast.error(res.error || "Failed to load order");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  function openAction(kind: Exclude<ActionKind, null>) {
    setAction(kind);
    setReason("");
  }

  async function handleSubmitAction() {
    if (!order || !action) return;
    if (action === "return" && !reason.trim()) {
      toast.error("Please provide a reason for the return");
      return;
    }

    setSubmitting(true);
    const res =
      action === "cancel"
        ? await api.post(`/api/v1/orders/${order._id}/cancel`, {
            reason: reason.trim() || undefined,
          })
        : await api.post(`/api/v1/orders/${order._id}/return`, {
            reason: reason.trim(),
          });

    if (res.success) {
      toast.success(
        action === "cancel"
          ? "Order cancelled successfully"
          : "Return requested successfully"
      );
      setAction(null);
      await loadOrder();
    } else {
      toast.error(res.error || "Action failed. Please try again.");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <PackageX className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
          <h3 className="font-heading text-lg font-semibold">Order not found</h3>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">
            This order doesn&apos;t exist or isn&apos;t associated with your account.
          </p>
          <Button asChild variant="outline">
            <Link href="/account/orders">Back to Orders</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const canCancel = CANCELLABLE.includes(order.status);
  const canReturn = order.status === OrderStatus.DELIVERED;
  const addr = order.shippingAddress;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2 gap-1 text-muted-foreground"
          onClick={() => router.push("/account/orders")}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Orders
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="font-heading text-2xl font-bold break-all md:text-3xl">
              {order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items.map((item) => (
            <div key={item.skuId} className="flex gap-4">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.imageUrl ? (
                  <Image
                    src={getMediaUrl(item.imageUrl)}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary/30">
                    {item.productName[0]}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center min-w-0">
                <p className="font-medium truncate">{item.productName}</p>
                <p className="text-sm text-muted-foreground">
                  {item.variantLabel} × {item.quantity}
                </p>
              </div>
              <div className="flex flex-col items-end justify-center">
                <p className="font-semibold">{formatPrice(item.totalPaise)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(item.pricePaise)} each
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Shipping address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-4 w-4 text-primary" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium">{addr.fullName}</p>
            <p className="mt-1 text-muted-foreground leading-relaxed">
              {addr.addressLine1}
              {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
              <br />
              {addr.city}, {addr.state} - {addr.pincode}
              <br />
              {addr.country}
            </p>
            <p className="mt-2 text-muted-foreground">Phone: {addr.phone}</p>
          </CardContent>
        </Card>

        {/* Price summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Price Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(order.pricing.subtotalPaise)}</span>
            </div>
            {order.pricing.discountPaise > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount</span>
                <span>-{formatPrice(order.pricing.discountPaise)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {order.pricing.shippingPaise === 0
                  ? "Free"
                  : formatPrice(order.pricing.shippingPaise)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatPrice(order.pricing.taxPaise)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-primary">
                {formatPrice(order.pricing.totalPaise)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {(canCancel || canReturn) && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 pt-6">
            {canCancel && (
              <Button
                variant="outline"
                className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => openAction("cancel")}
              >
                <PackageX className="h-4 w-4" />
                Cancel Order
              </Button>
            )}
            {canReturn && (
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={() => openAction("return")}
              >
                <RotateCcw className="h-4 w-4" />
                Request Return
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cancel / Return dialog */}
      <Dialog open={action !== null} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "cancel" ? "Cancel Order" : "Request Return"}
            </DialogTitle>
            <DialogDescription>
              {action === "cancel"
                ? "Are you sure you want to cancel this order? This cannot be undone."
                : "Tell us why you'd like to return this order."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason{action === "return" ? "*" : " (optional)"}
            </Label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={
                action === "cancel"
                  ? "e.g. Ordered by mistake"
                  : "e.g. Item didn't fit / was damaged"
              }
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAction(null)}
              disabled={submitting}
            >
              Keep Order
            </Button>
            <Button
              variant={action === "cancel" ? "destructive" : "default"}
              onClick={handleSubmitAction}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {action === "cancel" ? "Cancel Order" : "Request Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
