"use client";

import Link from "next/link";
import { Home, ShoppingBag, Tag, Heart, LogIn } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mobileLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Categories", href: "/categories/all", icon: Tag },
  { label: "New Arrivals", href: "/categories/new-arrivals", icon: ShoppingBag },
  { label: "Wishlist", href: "/wishlist", icon: Heart },
  { label: "Sign In", href: "/login", icon: LogIn },
];

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="text-left">
            <Logo size="lg" asLink={false} />
          </SheetTitle>
        </SheetHeader>
        <Separator />
        <nav className="flex flex-col gap-1 p-4">
          {mobileLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--accent-ui))] hover:text-[hsl(var(--foreground))]"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <Separator />
        <div className="p-4">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Premium Indian Fashion — Handpicked Elegance
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
