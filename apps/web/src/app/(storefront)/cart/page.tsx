"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/providers/CartProvider";
import { formatPrice } from "@/lib/utils";
import type { ICartItem } from "@vastrahub/shared-types";

export default function CartPage() {
  const { cart, loading, updateItem, removeItem, clearCart, itemCount } = useCart();

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex gap-4">
                  <Skeleton className="h-24 w-20 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="h-fit">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--muted))] mx-auto">
          <ShoppingBag className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
        </div>
        <h2 className="mt-6 font-heading text-2xl font-bold">Your cart is empty</h2>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Button variant="brand" size="lg" asChild className="mt-6">
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  const subtotal = cart.items.reduce(
    (sum: number, item: ICartItem) => sum + item.snapshot.pricePaise * item.quantity,
    0
  );
  const estimatedGst = Math.round(subtotal * 0.05); // 5% estimate
  const total = subtotal + estimatedGst;

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl md:text-3xl font-bold">
          Shopping Cart ({itemCount})
        </h1>
        <Button variant="ghost" size="sm" className="text-red-400" onClick={() => clearCart()}>
          <Trash2 className="mr-1 h-4 w-4" /> Clear Cart
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item: ICartItem) => (
            <Card key={item._id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Item Image */}
                  <div className="relative h-28 w-22 shrink-0 rounded-lg overflow-hidden bg-surface-secondary">
                    {item.snapshot.imageUrl ? (
                      <Image
                        src={item.snapshot.imageUrl}
                        alt={item.snapshot.productName}
                        fill
                        className="object-cover"
                        sizes="88px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-brand-400/30 text-2xl font-bold">
                        {item.snapshot.productName[0]}
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{item.snapshot.productName}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                      {item.snapshot.variantLabel}
                    </p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-sm font-bold text-brand-400">
                        {formatPrice(item.snapshot.pricePaise)}
                      </span>
                      {item.snapshot.mrpPaise > item.snapshot.pricePaise && (
                        <span className="text-xs text-[hsl(var(--muted-foreground))] line-through">
                          {formatPrice(item.snapshot.mrpPaise)}
                        </span>
                      )}
                    </div>

                    {/* Quantity + Remove */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          disabled={item.quantity <= 1}
                          onClick={() => updateItem(item.skuId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          disabled={item.quantity >= 10}
                          onClick={() => updateItem(item.skuId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-300"
                        onClick={() => removeItem(item.skuId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold">
                      {formatPrice(item.snapshot.pricePaise * item.quantity)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <Card className="h-fit sticky top-24">
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">Estimated GST (5%)</span>
              <span>{formatPrice(estimatedGst)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">Shipping</span>
              <span className="text-emerald-400">Free</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-brand-400">{formatPrice(total)}</span>
            </div>
            <Button variant="brand" size="lg" className="w-full" asChild>
              <Link href="/checkout">
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
