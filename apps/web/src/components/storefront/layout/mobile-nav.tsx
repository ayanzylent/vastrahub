"use client";

import Link from "next/link";
import {
  Home,
  ShoppingBag,
  Tag,
  Heart,
  LogIn,
  User,
  LayoutGrid,
  MapPin,
  Lock,
} from "lucide-react";
import { Logo } from "@/components/common/logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/auth-client";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const baseLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Categories", href: "/categories", icon: Tag },
  { label: "Collections", href: "/collections", icon: LayoutGrid },
  { label: "Shop", href: "/shop", icon: ShoppingBag },
];

const accountLinks = [
  { label: "Profile", href: "/account/profile", icon: User },
  { label: "My Orders", href: "/account/orders", icon: ShoppingBag },
  { label: "Wishlist", href: "/account/wishlist", icon: Heart },
  { label: "Addresses", href: "/account/addresses", icon: MapPin },
  { label: "Security", href: "/account/security", icon: Lock },
];

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const { data: sessionData } = useSession();
  const user = sessionData?.user;

  const authLinks = user
    ? accountLinks
    : [{ label: "Sign In", href: "/login", icon: LogIn }];

  const mobileLinks = [...baseLinks, ...authLinks];

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
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <Separator />
        <div className="p-4">
          <p className="text-xs text-muted-foreground">
            Premium Indian Fashion — Handpicked Elegance
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
