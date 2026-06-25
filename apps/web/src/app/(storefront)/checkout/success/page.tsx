"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, ShoppingBag, Truck, Calendar, Sparkles, Loader2, ArrowRight, XCircle, Clock } from "lucide-react";
import type { IOrder, IOrderItem } from "@vastrahub/shared-types";

/** Resolved payment state shown to the buyer. */
type PaymentState = "paid" | "failed" | "processing";

interface IciciStatusResult {
  outcome: "paid" | "failed" | "pending";
  paymentStatus: string;
}

// How long to keep polling a "processing" ICICI payment before giving up.
const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 8;

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const orderId = searchParams.get("orderId");
  // `status` is set by the ICICI callback redirect. COD/Razorpay omit it → treat as paid.
  const statusParam = searchParams.get("status");

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentState, setPaymentState] = useState<PaymentState>(
    statusParam === "failed" ? "failed" : statusParam === "processing" ? "processing" : "paid",
  );
  const pollCountRef = useRef(0);

  // Fetch order details (best-effort — we still render with the order number alone).
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get<IOrder>(`/api/v1/orders/${orderId}`);
        if (res.success && res.data) {
          setOrder(res.data);
        }
      } catch {
        // silently fail, we'll still show the order number
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  // Poll the ICICI status endpoint while the payment is still processing.
  useEffect(() => {
    if (paymentState !== "processing" || !orderId) return;

    let cancelled = false;
    const timer = setInterval(async () => {
      if (cancelled) return;
      pollCountRef.current += 1;

      try {
        const res = await api.get<IciciStatusResult>(`/api/v1/payment/icici/status/${orderId}`);
        if (res.success && res.data && res.data.outcome !== "pending") {
          setPaymentState(res.data.outcome === "paid" ? "paid" : "failed");
          // Refresh order details to reflect the new status.
          const orderRes = await api.get<IOrder>(`/api/v1/orders/${orderId}`);
          if (orderRes.success && orderRes.data) setOrder(orderRes.data);
          clearInterval(timer);
          return;
        }
      } catch {
        // ignore transient errors; keep polling until MAX_POLLS
      }

      if (pollCountRef.current >= MAX_POLLS) {
        clearInterval(timer);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [paymentState, orderId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500 mx-auto" />
        <h2 className="text-xl font-heading font-medium">Loading order details...</h2>
      </div>
    );
  }

  // Header content varies by payment state.
  const header = {
    paid: {
      icon: <CheckCircle2 className="h-10 w-10" />,
      iconWrap: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]",
      title: "Order Placed Successfully!",
      subtitle:
        "Thank you for shopping with VastraHub. Your order is confirmed and is currently being processed.",
    },
    processing: {
      icon: <Clock className="h-10 w-10" />,
      iconWrap: "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]",
      title: "Payment Processing",
      subtitle:
        "Your payment is being confirmed by the bank. This page will update automatically — you don't need to pay again.",
    },
    failed: {
      icon: <XCircle className="h-10 w-10" />,
      iconWrap: "bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]",
      title: "Payment Failed",
      subtitle:
        "We couldn't confirm your payment. No amount was captured. You can retry checkout or choose another payment method.",
    },
  }[paymentState];

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-12">
      {/* State Header */}
      <div className="text-center space-y-4 mb-10 animate-fade-in">
        <div className={`inline-flex h-20 w-20 items-center justify-center rounded-full border mb-2 ${header.iconWrap}`}>
          {paymentState === "processing" ? <Loader2 className="h-10 w-10 animate-spin" /> : header.icon}
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
          {header.title}
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] text-sm md:text-base max-w-md mx-auto leading-relaxed">
          {header.subtitle}
        </p>
      </div>

      {/* Details Card */}
      <Card className="glass-card shadow-lg border-border/40 overflow-hidden mb-8">
        <CardHeader className="bg-surface-secondary/20 border-b border-border/40 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wider">Order Number</p>
              <p className="font-mono font-bold text-base text-brand-400 mt-0.5">{orderNumber ?? "N/A"}</p>
            </div>
            {order?.createdAt && (
              <div className="sm:text-right">
                <p className="text-xs text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wider">Date & Time</p>
                <div className="flex items-center sm:justify-end gap-1.5 text-xs font-medium mt-1">
                  <Calendar className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                  <span>{new Date(order.createdAt).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">

          {/* Purchased Items */}
          {order?.items && order.items.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold font-heading tracking-wide flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-brand-400" /> Items Ordered
              </h3>
              <div className="divide-y divide-border/40 border border-border/40 rounded-xl overflow-hidden bg-surface-secondary/20">
                {order.items.map((item: IOrderItem) => (
                  <div key={item.skuId} className="flex gap-4 p-4 text-sm">
                    <div className="relative h-16 w-12 shrink-0 rounded-lg overflow-hidden bg-surface-secondary">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-brand-400/20 font-bold text-xl">
                          {item.productName[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-xs sm:text-sm">{item.productName}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        {item.variantLabel || "Default"}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-semibold text-xs sm:text-sm">
                        {formatPrice(item.pricePaise * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator className="bg-border/40" />

          {/* Delivery & Summary side-by-side */}
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            {/* Delivery Address */}
            {order?.shippingAddress && (
              <div className="space-y-3">
                <h3 className="font-bold font-heading tracking-wide flex items-center gap-2">
                  <Truck className="h-4 w-4 text-brand-400" /> Delivery Address
                </h3>
                <div className="bg-surface-secondary/20 p-4 rounded-xl border border-border/30">
                  <p className="font-semibold">{order.shippingAddress.fullName}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 leading-relaxed">
                    {order.shippingAddress.addressLine1}
                    {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                  </p>
                  <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mt-2">
                    Phone: {order.shippingAddress.phone}
                  </p>
                </div>
              </div>
            )}

            {/* Price breakdown */}
            <div className="space-y-3">
              <h3 className="font-bold font-heading tracking-wide flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-400" /> Billing Summary
              </h3>
              <div className="bg-surface-secondary/20 p-4 rounded-xl border border-border/30 space-y-2.5">
                {order && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-[hsl(var(--muted-foreground))]">Subtotal</span>
                      <span>{formatPrice(order.pricing.subtotalPaise)}</span>
                    </div>
                    {order.pricing.discountPaise > 0 && (
                      <div className="flex justify-between text-xs text-emerald-400 font-medium">
                        <span>Discount ({order.couponSnapshot?.code})</span>
                        <span>-{formatPrice(order.pricing.discountPaise)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-[hsl(var(--muted-foreground))]">Shipping</span>
                      <span className="text-emerald-400">Free</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[hsl(var(--muted-foreground))]">Estimated GST</span>
                      <span>₹0.00</span>
                    </div>
                    <Separator className="bg-border/30" />
                    <div className="flex justify-between font-bold text-sm pt-1">
                      <span>{paymentState === "paid" ? "Total Paid" : "Total Amount"}</span>
                      <span className="text-brand-400">{formatPrice(order.pricing.totalPaise)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {paymentState === "failed" ? (
          <>
            <Button variant="brand" size="lg" className="shadow-md shadow-brand-500/10" asChild>
              <Link href="/cart">
                Retry Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/">Continue Shopping</Link>
            </Button>
          </>
        ) : (
          <Button variant="brand" size="lg" className="shadow-md shadow-brand-500/10" asChild>
            <Link href="/">
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500 mx-auto" />
        <h2 className="text-xl font-heading font-medium">Loading order details...</h2>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}