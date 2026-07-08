"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/providers/CartProvider";
import { formatPrice } from "@/lib/utils";
import { getMediaUrl } from "@/lib/media";
import type { ICartItem } from "@/types";

export function CartDrawer() {
  const {
    cart,
    isDrawerOpen,
    closeDrawer,
    updateItem,
    removeItem,
    itemCount,
  } = useCart();

  const items = cart?.items ?? [];

  const subtotal = items.reduce(
    (sum: number, item: ICartItem) =>
      sum + (item.pricePaise ?? 0) * item.quantity,
    0,
  );

  const totalSavings = items.reduce(
    (sum: number, item: ICartItem) =>
      sum + ((item.mrpPaise ?? 0) - (item.pricePaise ?? 0)) * item.quantity,
    0,
  );

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent
        side="right"
        className="flex w-full data-[side=right]:w-[90%] flex-col p-0 sm:max-w-md"
      >
        {/* Header */}
        <SheetHeader className="border-b border-border/40 px-4 sm:px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-lg font-bold">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Shopping Cart
            {itemCount > 0 && (
              <Badge
                variant="default"
                className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px]"
              >
                {itemCount}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Your shopping cart items
          </SheetDescription>
        </SheetHeader>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold">
                Your cart is empty
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Looks like you haven&apos;t added anything yet.
              </p>
            </div>
            <Button
              variant="default"
              size="lg"
              asChild
              onClick={closeDrawer}
            >
              <Link href="/">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Scrollable items list */}
            <ScrollArea className="flex-1">
              <div className="divide-y divide-border/30 px-4 sm:px-6">
                {items.map((item: ICartItem) => (
                  <CartDrawerItem
                    key={item._id}
                    item={item}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Footer with subtotal + CTAs */}
            <div className="border-t border-border/40 bg-card/80 px-4 sm:px-6 py-5 space-y-4">
              {/* Savings callout */}
              {totalSavings > 0 && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  🎉 You&apos;re saving {formatPrice(totalSavings)}!
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Shipping & taxes calculated at checkout
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  onClick={closeDrawer}
                >
                  <Link href="/cart">View Cart</Link>
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  asChild
                  onClick={closeDrawer}
                >
                  <Link href="/checkout">
                    Checkout
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ─── Individual Cart Item Row ─── */

interface CartDrawerItemProps {
  item: ICartItem;
  onUpdate: (skuId: string, quantity: number) => Promise<void>;
  onRemove: (skuId: string) => Promise<void>;
}

function CartDrawerItem({ item, onUpdate, onRemove }: CartDrawerItemProps) {
  const price = item.pricePaise ?? 0;
  const mrp = item.mrpPaise ?? price;
  const lineTotal = price * item.quantity;
  const discount =
    mrp > price
      ? Math.round(
          ((mrp - price) /
            mrp) *
            100,
        )
      : 0;

  return (
    <div className="flex gap-2 sm:gap-3 py-4 group">
      {/* Image */}
      <div className="relative h-[88px] w-[68px] shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.imageUrl ? (
          <Image
            src={getMediaUrl(item.imageUrl)}
            alt={item.productName ?? ""}
            fill
            className="object-cover"
            sizes="68px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary/30">
            {(item.productName ?? "P")[0]}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col min-w-0">
        <h4 className="text-sm font-medium leading-snug line-clamp-2">
          {item.productName}
        </h4>
        {item.variantLabel && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {item.variantLabel}
          </p>
        )}

        {/* Price row */}
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 mt-1">
          <span className="text-sm font-semibold text-primary">
            {formatPrice(price)}
          </span>
          {discount > 0 && (
            <>
              <span className="text-[10px] text-muted-foreground line-through">
                {formatPrice(mrp)}
              </span>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                {discount}% off
              </span>
            </>
          )}
        </div>

        {/* Quantity + Remove */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              disabled={item.quantity <= 1}
              onClick={() => onUpdate(item.skuId, item.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-5 text-center text-xs font-medium">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              disabled={item.quantity >= 10}
              onClick={() => onUpdate(item.skuId, item.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={() => onRemove(item.skuId)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Line total */}
      <div className="shrink-0 text-right">
        <span className="text-sm font-bold">{formatPrice(lineTotal)}</span>
      </div>
    </div>
  );
}
