"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { useCart } from "@/providers/CartProvider";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { INDIAN_STATES } from "@vastrahub/shared-constants";
import { toast } from "sonner";
import { MapPin, CreditCard, ChevronRight, Loader2, Plus, Sparkles, AlertCircle } from "lucide-react";
import type { IAddress, ApiResponse } from "@vastrahub/shared-types";

interface CheckoutItem {
  productId: string;
  skuId: string;
  productName: string;
  skuCode?: string;
  variantLabel: string;
  imageUrl?: string;
  pricePaise: number;
  quantity: number;
}

interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountAmountPaise: number;
  message?: string;
}

interface CheckoutOrderResult {
  orderId: string;
  orderNumber: string;
  paymentId: string;
  iciciOrderId?: string;
  iciciMerchantId?: string;
  iciciRedirectURI?: string;
  gatewayOrderId?: string;
  totalPaise: number;
  paymentMethod: "icici" | "cod";
}

interface EnrichedStorefrontSku {
  _id: string;
  productId: string;
  productName: string;
  skuCode: string;
  pricePaise: number;
  mrpPaise: number;
  attributes: Record<string, string>;
  stockQuantity: number;
  imageUrl?: string;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: sessionLoading } = useSession();
  const { cart, loading: cartLoading, fetchCart, clearCart } = useCart();

  // Query Params for Buy Now
  const mode = searchParams.get("mode");
  const skuId = searchParams.get("skuId");
  const qtyParam = searchParams.get("qty");
  const quantity = qtyParam ? parseInt(qtyParam, 10) : 1;

  // Checkout Data
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [addressesLoading, setAddressesLoading] = useState(true);

  // Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "Delhi",
    pincode: "",
    isDefault: false,
  });
  const [addingAddress, setAddingAddress] = useState(false);

  // Coupon State
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmountPaise: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"icici" | "cod">("icici");
  const [customerNotes, setCustomerNotes] = useState("");
  const [processingOrder, setProcessingOrder] = useState(false);

  // Redirect guest user
  useEffect(() => {
    if (!sessionLoading && !session) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
    }
  }, [session, sessionLoading, router]);

  // Fetch addresses
  const loadAddresses = async () => {
    setAddressesLoading(true);
    try {
      const res = await api.get<IAddress[]>("/api/v1/user/addresses");
      if (res.success && res.data) {
        setAddresses(res.data);
        const defaultAddress = res.data.find((addr) => addr.isDefault) || res.data[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
        }
      }
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadAddresses();
    }
  }, [session]);

  // Load checkout items
  useEffect(() => {
    const fetchItems = async () => {
      setItemsLoading(true);
      if (mode === "buynow" && skuId) {
        try {
          const res = await api.get<EnrichedStorefrontSku>(`/api/v1/storefront/skus/${skuId}`);
          if (res.success && res.data) {
            const sku = res.data;
            // Build variant label
            let variantLabel = "Default";
            if (sku.attributes) {
              variantLabel = Object.values(sku.attributes).join(" / ") || "Default";
            }
            setCheckoutItems([
              {
                productId: sku.productId,
                skuId: sku._id,
                productName: sku.productName,
                skuCode: sku.skuCode,
                variantLabel,
                imageUrl: sku.imageUrl,
                pricePaise: sku.pricePaise,
                quantity: quantity,
              },
            ]);
          } else {
            toast.error(res.error || "Failed to load Buy Now product");
            router.push("/cart");
          }
        } catch {
          toast.error("Failed to fetch SKU info");
          router.push("/cart");
        } finally {
          setItemsLoading(false);
        }
      } else {
        // Normal Cart mode
        if (cart) {
          const items = cart.items.map((item) => ({
            productId: item.productId,
            skuId: item.skuId,
            productName: item.productName ?? "",
            skuCode: undefined,
            variantLabel: item.variantLabel ?? "",
            imageUrl: item.imageUrl,
            pricePaise: item.pricePaise ?? 0,
            quantity: item.quantity,
          }));
          setCheckoutItems(items);
          setItemsLoading(false);
        } else if (!cartLoading) {
          // fetch cart manually if not loaded
          fetchCart();
        }
      }
    };

    if (session) {
      fetchItems();
    }
  }, [session, mode, skuId, quantity, cart, cartLoading, fetchCart, router]);

  // Sync cart items if cart updates in background
  useEffect(() => {
    if (mode !== "buynow" && cart) {
      const items = cart.items.map((item) => ({
        productId: item.productId,
        skuId: item.skuId,
        productName: item.productName ?? "",
        skuCode: undefined,
        variantLabel: item.variantLabel ?? "",
        imageUrl: item.imageUrl,
        pricePaise: item.pricePaise ?? 0,
        quantity: item.quantity,
      }));
      setCheckoutItems(items);
      setItemsLoading(false);
    }
  }, [cart, mode]);

  // Subtotal Calculation
  const subtotal = checkoutItems.reduce((sum, item) => sum + item.pricePaise * item.quantity, 0);
  const discount = appliedCoupon ? appliedCoupon.discountAmountPaise : 0;
  const shipping = 0; // Free
  const tax = 0; // Tax is 0 in backend
  const total = Math.max(0, subtotal - discount + shipping + tax);

  // Apply Coupon
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setApplyingCoupon(true);
    setCouponError("");

    try {
      const productIds = checkoutItems.map((item) => item.productId);
      const res = await api.post<CouponValidationResult>("/api/v1/storefront/coupons/validate", {
        code: couponCodeInput.toUpperCase().trim(),
        cartSubtotalPaise: subtotal,
        cartItemProductIds: productIds,
      });

      if (res.success && res.data && res.data.valid) {
        setAppliedCoupon({
          code: res.data.code,
          discountAmountPaise: res.data.discountAmountPaise,
        });
        toast.success(`Coupon "${res.data.code}" applied successfully!`);
      } else {
        setCouponError(res.data?.message || res.error || "Invalid coupon code");
        toast.error("Failed to apply coupon");
      }
    } catch {
      setCouponError("Could not validate coupon. Please try again.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponError("");
  };

  // Add Address Form Submit
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.fullName || !newAddress.phone || !newAddress.addressLine1 || !newAddress.city || !newAddress.pincode) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!/^[0-9]{6}$/.test(newAddress.pincode)) {
      toast.error("Pincode must be a 6-digit number");
      return;
    }

    setAddingAddress(true);
    try {
      const res = await api.post<IAddress>("/api/v1/user/addresses", newAddress);
      if (res.success && res.data) {
        toast.success("Address added successfully");
        const savedAddress = res.data as IAddress;
        setAddresses((prev) => [...prev, savedAddress]);
        setSelectedAddressId(savedAddress._id);
        setShowAddressForm(false);
        setNewAddress({
          label: "Home",
          fullName: "",
          phone: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "Delhi",
          pincode: "",
          isDefault: false,
        });
      } else {
        toast.error(res.error || "Failed to add address");
      }
    } catch {
      toast.error("Failed to save address");
    } finally {
      setAddingAddress(false);
    }
  };

  // Handle Order Placement
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a shipping address");
      return;
    }

    setProcessingOrder(true);
    try {
      let orderRes: ApiResponse<CheckoutOrderResult>;
      const baseBody = {
        addressId: selectedAddressId,
        paymentMethod,
        couponCode: appliedCoupon?.code,
        customerNotes,
      };

      if (mode === "buynow" && skuId) {
        orderRes = await api.post<CheckoutOrderResult>("/api/v1/checkout/buy-now", {
          skuId,
          quantity,
          ...baseBody,
        });
      } else {
        orderRes = await api.post<CheckoutOrderResult>("/api/v1/checkout/create-order", baseBody);
      }

      if (!orderRes.success || !orderRes.data) {
        toast.error(orderRes.error || "Failed to create order");
        setProcessingOrder(false);
        return;
      }

      const orderData = orderRes.data;
      const { orderId, orderNumber } = orderData;

      // Handle payment gateways
      if (paymentMethod === "cod") {
        toast.success("Order placed successfully (Cash on Delivery)!");
        if (mode !== "buynow") {
          await clearCart();
        }
        router.push(`/checkout/success?orderNumber=${orderNumber}&orderId=${orderId}`);
      } else if (paymentMethod === "icici") {
        // Redirect to the ICICI hosted payment page. The bank POSTs the result
        // back to our server callback, which redirects to /checkout/success.
        if (!orderData.iciciRedirectURI) {
          toast.error("Could not start ICICI payment. Please try again.");
          setProcessingOrder(false);
          return;
        }
        toast.info("Redirecting to ICICI Bank secure payment page...");
        // Cart is already cleared server-side on order creation; clear locally
        // before leaving the site so the browser doesn't navigate back to stale state.
        if (mode !== "buynow") {
          await clearCart();
        }
        window.location.href = orderData.iciciRedirectURI;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error(message);
      setProcessingOrder(false);
    }
  };

  if (sessionLoading || addressesLoading || itemsLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-12">
        <div className="space-y-4 max-w-lg mx-auto py-20 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand-500 mx-auto" />
          <h2 className="text-xl font-medium font-heading">Preparing secure checkout...</h2>
        </div>
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-20 text-center">
        <h2 className="font-heading text-2xl font-bold">No items found for checkout</h2>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">Your cart is empty or Buy Now SKU is invalid.</p>
        <Button variant="brand" size="lg" className="mt-6" asChild>
          <Link href="/">Back to Shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">

      {/* Header breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] mb-6 font-medium">
        <Link href="/cart" className="hover:text-brand-400">Cart</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-brand-400 font-semibold">Checkout</span>
      </div>

      <h1 className="font-heading text-3xl font-bold mb-8">Secure Checkout</h1>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Delivery & Payment Details */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 1: Delivery Address */}
          <Card className="glass-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <CardTitle className="text-lg">Delivery Address</CardTitle>
              </div>
              {!showAddressForm && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setShowAddressForm(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> New Address
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              {showAddressForm ? (
                <form onSubmit={handleAddAddress} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="label">Address Label (Home / Work)*</Label>
                      <Input
                        id="label"
                        value={newAddress.label}
                        onChange={(e) => setNewAddress((prev) => ({ ...prev, label: e.target.value }))}
                        placeholder="e.g. Home, Office"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Receiver Full Name*</Label>
                      <Input
                        id="fullName"
                        value={newAddress.fullName}
                        onChange={(e) => setNewAddress((prev) => ({ ...prev, fullName: e.target.value }))}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Contact Phone Number*</Label>
                      <Input
                        id="phone"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="10 digit mobile number"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">6-Digit Pincode*</Label>
                      <Input
                        id="pincode"
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress((prev) => ({ ...prev, pincode: e.target.value }))}
                        placeholder="e.g. 110001"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressLine1">Address Line 1*</Label>
                    <Input
                      id="addressLine1"
                      value={newAddress.addressLine1}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, addressLine1: e.target.value }))}
                      placeholder="Flat/House No., Building, Apartment, Street"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                    <Input
                      id="addressLine2"
                      value={newAddress.addressLine2}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, addressLine2: e.target.value }))}
                      placeholder="Landmark, Area, Colony"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City*</Label>
                      <Input
                        id="city"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress((prev) => ({ ...prev, city: e.target.value }))}
                        placeholder="New Delhi"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State*</Label>
                      <select
                        id="state"
                        className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm ring-offset-[hsl(var(--background))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress((prev) => ({ ...prev, state: e.target.value }))}
                      >
                        {INDIAN_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      id="isDefault"
                      type="checkbox"
                      className="rounded border-border bg-background text-brand-500 focus:ring-brand-500 h-4 w-4"
                      checked={newAddress.isDefault}
                      onChange={(e) => setNewAddress((prev) => ({ ...prev, isDefault: e.target.checked }))}
                    />
                    <Label htmlFor="isDefault" className="text-sm font-medium cursor-pointer">
                      Make this my default shipping address
                    </Label>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-border/40">
                    <Button type="submit" variant="brand" disabled={addingAddress}>
                      {addingAddress && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save & Deliver Here
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddressForm(false)} disabled={addingAddress}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {addresses.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-[hsl(var(--muted-foreground))] text-sm">No shipping addresses saved yet.</p>
                      <Button
                        variant="brand"
                        className="mt-4"
                        onClick={() => setShowAddressForm(true)}
                      >
                        Add New Address
                      </Button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {addresses.map((address) => (
                        <div
                          key={address._id}
                          onClick={() => setSelectedAddressId(address._id)}
                          className={`relative p-4 rounded-xl border-2 text-left cursor-pointer transition-all duration-200 ${
                            selectedAddressId === address._id
                              ? "border-brand-500 bg-brand-500/5 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                              : "border-border/60 hover:border-border-hover bg-surface-secondary/40"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-brand-500/10 text-brand-400">
                              {address.label}
                            </span>
                            {address.isDefault && (
                              <span className="text-[10px] uppercase font-bold tracking-wider text-[hsl(var(--muted-foreground))]">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-sm truncate">{address.fullName}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 leading-relaxed">
                            {address.addressLine1}
                            {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                          </p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          <p className="text-xs font-medium mt-3 text-[hsl(var(--muted-foreground))]">
                            Phone: {address.phone}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Payment Gateway Selection */}
          <Card className="glass-card">
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
                  <CreditCard className="h-4 w-4" />
                </div>
                <CardTitle className="text-lg">Select Payment Method</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">

                {/* ICICI Bank gateway */}
                <div
                  onClick={() => setPaymentMethod("icici")}
                  className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all duration-200 ${
                    paymentMethod === "icici"
                      ? "border-brand-500 bg-brand-500/5 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                      : "border-border/60 hover:border-border-hover bg-surface-secondary/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold">ICICI Bank Gateway</span>
                    <input
                      type="radio"
                      checked={paymentMethod === "icici"}
                      onChange={() => setPaymentMethod("icici")}
                      className="text-brand-500 focus:ring-brand-500"
                    />
                  </div>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] leading-normal">
                    Pay securely via the ICICI Bank hosted gateway using UPI, cards, or net banking.
                  </p>
                </div>

                {/* Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod("cod")}
                  className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all duration-200 ${
                    paymentMethod === "cod"
                      ? "border-brand-500 bg-brand-500/5 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                      : "border-border/60 hover:border-border-hover bg-surface-secondary/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold">Cash on Delivery</span>
                    <input
                      type="radio"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="text-brand-500 focus:ring-brand-500"
                    />
                  </div>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] leading-normal">
                    Pay with cash at the time of delivery. Additional verification may apply.
                  </p>
                </div>

              </div>

              {/* Customer Notes */}
              <div className="space-y-2 pt-4">
                <Label htmlFor="notes">Delivery instructions or notes (Optional)</Label>
                <Input
                  id="notes"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="e.g. Please leave package at the security desk."
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Items & Summary */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Order Summary & Cart items */}
          <Card className="glass-card sticky top-24">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              {/* Checkout Items List */}
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {checkoutItems.map((item) => (
                  <div key={item.skuId} className="flex gap-3 text-sm">
                    <div className="relative h-14 w-11 shrink-0 rounded-lg overflow-hidden bg-surface-secondary">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-brand-400/30 font-bold text-lg">
                          {item.productName[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-xs">{item.productName}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                        {item.variantLabel} × {item.quantity}
                      </p>
                      <p className="text-xs font-semibold text-brand-400 mt-1">
                        {formatPrice(item.pricePaise * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="bg-border/60" />

              {/* Coupon Form */}
              {!appliedCoupon ? (
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <Label htmlFor="coupon" className="text-xs font-semibold">Apply Discount Coupon</Label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      placeholder="ENTER COUPON CODE"
                      className="uppercase text-center font-mono placeholder:normal-case placeholder:font-sans"
                      value={couponCodeInput}
                      onChange={(e) => {
                        setCouponCodeInput(e.target.value);
                        setCouponError("");
                      }}
                      disabled={applyingCoupon}
                    />
                    <Button variant="outline" type="submit" disabled={applyingCoupon || !couponCodeInput.trim()}>
                      {applyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {couponError}
                    </p>
                  )}
                </form>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-400">Coupon Applied</p>
                      <p className="text-xs font-mono font-bold">{appliedCoupon.code}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-transparent h-fit p-1"
                    onClick={handleRemoveCoupon}
                  >
                    Remove
                  </Button>
                </div>
              )}

              <Separator className="bg-border/60" />

              {/* Pricing Breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Shipping</span>
                  <span className="text-emerald-400">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Estimated GST</span>
                  <span>₹0.00</span>
                </div>
                <Separator className="bg-border/60" />
                <div className="flex justify-between font-bold text-lg pt-1">
                  <span>Total Amount</span>
                  <span className="text-brand-400">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <Button
                variant="brand"
                size="lg"
                className="w-full font-bold shadow-md shadow-brand-500/20"
                onClick={handlePlaceOrder}
                disabled={processingOrder || !selectedAddressId}
              >
                {processingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  paymentMethod === "cod" ? "Place Order" : `Pay ${formatPrice(total)}`
                )}
              </Button>

              <p className="text-[10px] text-center text-[hsl(var(--muted-foreground))]">
                By completing your order, you agree to our Terms & Conditions and Refund Policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-12">
        <div className="space-y-4 max-w-lg mx-auto py-20 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand-500 mx-auto" />
          <h2 className="text-xl font-medium font-heading">Preparing secure checkout...</h2>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
