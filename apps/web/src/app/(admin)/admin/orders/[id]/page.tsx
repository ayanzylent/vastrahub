"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Package,
  Truck,
  CreditCard,
  MapPin,
  Clock,
  RefreshCw,
  ExternalLink,
  Loader2,
  CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import type { IOrder } from "@/types";
import {
  ORDER_STATUS_TRANSITIONS,
  type OrderStatusType,
} from "@/constants";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PaymentData {
  _id: string;
  gatewayName: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  amountPaise: number;
  currency: string;
  method?: string;
  status: string;
  paidAt?: string;
  failedAt?: string;
  failureReason?: string;
  refunds: {
    amountPaise: number;
    reason: string;
    status: string;
    initiatedAt: string;
    completedAt?: string;
  }[];
}

interface StatusHistoryEntry {
  status: string;
  changedAt: string;
  changedBy: string;
  note?: string;
}

interface ShippingInfo {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

interface AdminOrderDetail extends Omit<IOrder, "paymentId" | "status"> {
  status: string;
  statusHistory: StatusHistoryEntry[];
  shipping?: ShippingInfo;
  paymentId?: PaymentData;
  adminNotes?: string;
  customerNotes?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return Requested",
  returned: "Returned",
  failed: "Failed",
};

function getStatusTone(status: string): StatusTone {
  switch (status) {
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

function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr?: string | Date): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Status update state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Shipping update state
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [shippingTrackingNumber, setShippingTrackingNumber] = useState("");
  const [shippingTrackingUrl, setShippingTrackingUrl] = useState("");
  const [shippingEstimatedDelivery, setShippingEstimatedDelivery] = useState("");
  const [updatingShipping, setUpdatingShipping] = useState(false);

  // Refund state
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundAmountRupees, setRefundAmountRupees] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [processingRefund, setProcessingRefund] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<AdminOrderDetail>(
        `/api/v1/admin/orders/${orderId}`
      );
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        toast.error("Order not found");
        router.push("/admin/orders");
      }
    } catch {
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Populate shipping dialog when opening
  useEffect(() => {
    if (shippingDialogOpen && order?.shipping) {
      setShippingCarrier(order.shipping.carrier || "");
      setShippingTrackingNumber(order.shipping.trackingNumber || "");
      setShippingTrackingUrl(order.shipping.trackingUrl || "");
      setShippingEstimatedDelivery(
        order.shipping.estimatedDelivery
          ? new Date(order.shipping.estimatedDelivery).toISOString().slice(0, 10)
          : ""
      );
    }
  }, [shippingDialogOpen, order?.shipping]);

  /* ---- Actions ---- */

  async function handleUpdateStatus() {
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await api.put(`/api/v1/admin/orders/${orderId}/status`, {
        status: newStatus,
        note: statusNote || undefined,
      });
      if (res.success) {
        toast.success(`Status updated to "${STATUS_LABELS[newStatus] || newStatus}"`);
        setStatusDialogOpen(false);
        setNewStatus("");
        setStatusNote("");
        fetchOrder();
      } else {
        toast.error(res.error || "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleUpdateShipping() {
    setUpdatingShipping(true);
    try {
      const body: Record<string, string> = {};
      if (shippingCarrier) body.carrier = shippingCarrier;
      if (shippingTrackingNumber) body.trackingNumber = shippingTrackingNumber;
      if (shippingTrackingUrl) body.trackingUrl = shippingTrackingUrl;
      if (shippingEstimatedDelivery) body.estimatedDelivery = shippingEstimatedDelivery;

      const res = await api.put(`/api/v1/admin/orders/${orderId}/shipping`, body);
      if (res.success) {
        toast.success("Shipping info updated");
        setShippingDialogOpen(false);
        fetchOrder();
      } else {
        toast.error(res.error || "Failed to update shipping");
      }
    } catch {
      toast.error("Failed to update shipping");
    } finally {
      setUpdatingShipping(false);
    }
  }

  async function handleRefund() {
    const amountPaise = Math.round(parseFloat(refundAmountRupees) * 100);
    if (!amountPaise || amountPaise < 1 || !refundReason.trim()) {
      toast.error("Please enter a valid amount and reason");
      return;
    }
    setProcessingRefund(true);
    try {
      const res = await api.post(`/api/v1/admin/orders/${orderId}/refund`, {
        amountPaise,
        reason: refundReason,
      });
      if (res.success) {
        toast.success("Refund initiated");
        setRefundDialogOpen(false);
        setRefundAmountRupees("");
        setRefundReason("");
        fetchOrder();
      } else {
        toast.error(res.error || "Failed to initiate refund");
      }
    } catch {
      toast.error("Failed to initiate refund");
    } finally {
      setProcessingRefund(false);
    }
  }

  /* ---- Derived ---- */

  const validNextStatuses = order
    ? (ORDER_STATUS_TRANSITIONS[order.status as OrderStatusType] || [])
    : [];

  const payment = order?.paymentId;
  const totalRefunded = payment?.refunds?.reduce((s, r) => s + r.amountPaise, 0) ?? 0;
  const refundableAmount = payment ? payment.amountPaise - totalRefunded : 0;

  /* ---- Loading skeleton ---- */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-20 ml-2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
            <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
          </div>
          <div className="space-y-6">
            <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
            <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Package className="h-12 w-12 opacity-20 mb-4" />
        <p>Order not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  /* ---- Render ---- */

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-heading text-2xl md:text-3xl font-bold truncate">
              {order.orderNumber}
            </h1>
            <StatusBadge
              tone={getStatusTone(order.status)}
              className="text-xs uppercase font-semibold tracking-wider"
            >
              {order.status.replace(/_/g, " ")}
            </StatusBadge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Placed on {formatDateTime(order.createdAt as unknown as string)}
          </p>
        </div>
      </div>

      {/* ---- Action Buttons ---- */}
      <div className="flex flex-wrap gap-2">
        {/* Update Status */}
        {validNextStatuses.length > 0 && (
          <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" /> Update Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Order Status</DialogTitle>
                <DialogDescription>
                  Current status: <strong className="capitalize">{order.status.replace(/_/g, " ")}</strong>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-status">New Status</Label>
                  <select
                    id="new-status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="">Select status...</option>
                    {validNextStatuses.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s] || s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status-note">Note (optional)</Label>
                  <textarea
                    id="status-note"
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    placeholder="Add a note about this status change..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateStatus} disabled={!newStatus || updatingStatus}>
                  {updatingStatus && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Status
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Update Shipping */}
        <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Truck className="h-4 w-4 mr-2" /> Update Shipping
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Shipping Information</DialogTitle>
              <DialogDescription>
                Add or update carrier and tracking details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="carrier">Carrier</Label>
                <Input
                  id="carrier"
                  placeholder="e.g. BlueDart, Delhivery, DTDC"
                  value={shippingCarrier}
                  onChange={(e) => setShippingCarrier(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking-number">Tracking Number</Label>
                <Input
                  id="tracking-number"
                  placeholder="Tracking number"
                  value={shippingTrackingNumber}
                  onChange={(e) => setShippingTrackingNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking-url">Tracking URL</Label>
                <Input
                  id="tracking-url"
                  placeholder="https://..."
                  value={shippingTrackingUrl}
                  onChange={(e) => setShippingTrackingUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="est-delivery">Estimated Delivery</Label>
                <Input
                  id="est-delivery"
                  type="date"
                  value={shippingEstimatedDelivery}
                  onChange={(e) => setShippingEstimatedDelivery(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShippingDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateShipping} disabled={updatingShipping}>
                {updatingShipping && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Initiate Refund */}
        {payment && refundableAmount > 0 && (
          <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                <CreditCard className="h-4 w-4 mr-2" /> Initiate Refund
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Initiate Refund</DialogTitle>
                <DialogDescription>
                  Refundable amount: <strong>{formatPrice(refundableAmount)}</strong>
                  {totalRefunded > 0 && (
                    <> (already refunded: {formatPrice(totalRefunded)})</>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="refund-amount">Amount (₹)</Label>
                  <Input
                    id="refund-amount"
                    type="number"
                    min="1"
                    step="0.01"
                    max={refundableAmount / 100}
                    placeholder="Enter amount in rupees"
                    value={refundAmountRupees}
                    onChange={(e) => setRefundAmountRupees(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refund-reason">Reason</Label>
                  <textarea
                    id="refund-reason"
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    placeholder="Reason for refund..."
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={handleRefund}
                  disabled={processingRefund || !refundAmountRupees || !refundReason.trim()}
                >
                  {processingRefund && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirm Refund
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* ---- Main Grid ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---- Left Column (2/3) ---- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" /> Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                        Variant
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-border/20 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
                              {item.imageUrl ? (
                                <Image
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-primary/30 text-sm font-bold">
                                  {item.productName?.[0] || "?"}
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-medium truncate max-w-[200px]">
                              {item.productName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                          {item.variantLabel || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatPrice(item.pricePaise)}
                          {item.mrpPaise > item.pricePaise && (
                            <span className="text-xs text-muted-foreground line-through ml-1">
                              {formatPrice(item.mrpPaise)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          {formatPrice(item.totalPaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
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
                <Separator />
                <div className="flex justify-between font-semibold text-base pt-1">
                  <span>Total</span>
                  <span>{formatPrice(order.pricing.totalPaise)}</span>
                </div>
              </div>

              {order.couponSnapshot && (
                <>
                  <Separator className="my-4" />
                  <div className="text-sm">
                    <span className="text-muted-foreground">Coupon applied: </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-medium">
                      {order.couponSnapshot.code}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      ({order.couponSnapshot.discountType === "percentage"
                        ? `${order.couponSnapshot.percentageValue}%`
                        : formatPrice(order.couponSnapshot.fixedAmountPaise ?? 0)}{" "}
                      off)
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Status History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6 space-y-6">
                  {/* Timeline line */}
                  <div className="absolute left-[9px] top-1 bottom-1 w-px bg-border" />

                  {[...order.statusHistory].reverse().map((entry, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-6 top-0.5">
                        <CircleDot
                          className={`h-[18px] w-[18px] ${
                            idx === 0
                              ? "text-primary fill-primary/20"
                              : "text-muted-foreground/50 fill-background"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge
                            tone={getStatusTone(entry.status)}
                            className="text-[10px] uppercase font-semibold tracking-wider"
                          >
                            {entry.status.replace(/_/g, " ")}
                          </StatusBadge>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(entry.changedAt)}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-sm text-muted-foreground mt-1">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ---- Right Column (1/3) ---- */}
        <div className="space-y-6">
          {/* Customer & Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{order.shippingAddress.fullName}</p>
              <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
              <p className="text-muted-foreground">
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
              </p>
              <p className="text-muted-foreground">
                {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
              </p>
              <p className="text-muted-foreground">{order.shippingAddress.country}</p>
            </CardContent>
          </Card>

          {/* Shipping Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4" /> Shipping Details
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              {order.shipping ? (
                <>
                  {order.shipping.carrier && (
                    <div>
                      <span className="text-muted-foreground">Carrier: </span>
                      <span className="font-medium">{order.shipping.carrier}</span>
                    </div>
                  )}
                  {order.shipping.trackingNumber && (
                    <div>
                      <span className="text-muted-foreground">Tracking: </span>
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                        {order.shipping.trackingNumber}
                      </span>
                      {order.shipping.trackingUrl && (
                        <a
                          href={order.shipping.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Track <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                  {order.shipping.estimatedDelivery && (
                    <div>
                      <span className="text-muted-foreground">Est. Delivery: </span>
                      <span>{formatDate(order.shipping.estimatedDelivery)}</span>
                    </div>
                  )}
                  {order.shipping.shippedAt && (
                    <div>
                      <span className="text-muted-foreground">Shipped: </span>
                      <span>{formatDateTime(order.shipping.shippedAt)}</span>
                    </div>
                  )}
                  {order.shipping.deliveredAt && (
                    <div>
                      <span className="text-muted-foreground">Delivered: </span>
                      <span>{formatDateTime(order.shipping.deliveredAt)}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground italic">No shipping info yet</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              {payment ? (
                <>
                  <div>
                    <span className="text-muted-foreground">Gateway: </span>
                    <span className="font-medium capitalize">{payment.gatewayName}</span>
                  </div>
                  {payment.method && (
                    <div>
                      <span className="text-muted-foreground">Method: </span>
                      <span className="capitalize">{payment.method.replace(/_/g, " ")}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Amount: </span>
                    <span className="font-medium">{formatPrice(payment.amountPaise)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status: </span>
                    <StatusBadge
                      tone={
                        payment.status === "captured" ? "success" :
                        payment.status === "failed" ? "danger" :
                        payment.status === "refunded" ? "info" :
                        "warning"
                      }
                      className="text-[10px] uppercase font-semibold tracking-wider"
                    >
                      {payment.status.replace(/_/g, " ")}
                    </StatusBadge>
                  </div>
                  {payment.paidAt && (
                    <div>
                      <span className="text-muted-foreground">Paid at: </span>
                      <span>{formatDateTime(payment.paidAt)}</span>
                    </div>
                  )}
                  {payment.failureReason && (
                    <div className="text-destructive text-xs">
                      Failure: {payment.failureReason}
                    </div>
                  )}

                  {/* Refund history */}
                  {payment.refunds && payment.refunds.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Refunds
                        </p>
                        {payment.refunds.map((refund, idx) => (
                          <div
                            key={idx}
                            className="rounded-md border border-border/50 p-3 space-y-1"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">
                                {formatPrice(refund.amountPaise)}
                              </span>
                              <StatusBadge
                                tone={
                                  refund.status === "completed" ? "success" :
                                  refund.status === "failed" ? "danger" :
                                  "warning"
                                }
                                className="text-[9px] uppercase"
                              >
                                {refund.status}
                              </StatusBadge>
                            </div>
                            <p className="text-xs text-muted-foreground">{refund.reason}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(refund.initiatedAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground italic">No payment info</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {(order.customerNotes || order.adminNotes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                {order.customerNotes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Customer Note
                    </p>
                    <p className="text-muted-foreground">{order.customerNotes}</p>
                  </div>
                )}
                {order.adminNotes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Admin Note
                    </p>
                    <p className="text-muted-foreground">{order.adminNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
