"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, User, Menu, LogOut, Heart, Settings, MapPin, Lock } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { CartDrawer } from "@/components/storefront/layout/cart-drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "@/components/storefront/layout/mobile-nav";
import { SearchDialog } from "@/components/storefront/layout/search-dialog";
import { useSession, signOut } from "@/lib/auth-client";
import { useCart } from "@/providers/CartProvider";
import { toast } from "sonner";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Categories", href: "/categories" },
  { label: "Collections", href: "/collections" },
  { label: "New Arrivals", href: "/shop?sortBy=newest" },
];

export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const { data: sessionData } = useSession();
  const user = sessionData?.user;
  const { itemCount, openDrawer } = useCart();
  const router = useRouter();

  const userInitials = user?.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "U";

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out successfully");
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          {/* Mobile Menu Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>

          {/* Logo */}
          <Logo size="md" />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar (Desktop Trigger) */}
          <button
            type="button"
            onClick={() => setSearchDialogOpen(true)}
            className="hidden lg:flex items-center justify-between w-full max-w-md mx-4 px-3.5 py-1.5 bg-muted/40 hover:bg-muted/70 border border-border/50 rounded-lg text-muted-foreground text-sm transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span>Search sarees, lehengas, kurtas...</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[9px] font-medium text-muted-foreground/80 opacity-100">
              Ctrl K
            </kbd>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <ThemeToggle />

            {/* Search (Mobile Trigger) */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSearchDialogOpen(true)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>


            {/* Cart */}
            <Button variant="ghost" size="icon" className="relative" onClick={openDrawer}>
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full bg-primary text-primary-foreground font-bold"
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </Badge>
              )}
              <span className="sr-only">Cart</span>
            </Button>

            {/* User */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image || ""} alt={user.name} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders" className="cursor-pointer">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/wishlist" className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      Wishlist
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/addresses" className="cursor-pointer">
                      <MapPin className="mr-2 h-4 w-4" />
                      Addresses
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/security" className="cursor-pointer">
                      <Lock className="mr-2 h-4 w-4" />
                      Security
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" || user.role === "superadmin" ? (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/login">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Account</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

      </header>

      {/* Mobile Nav Sheet */}
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Search Command Dialog Overlay */}
      <SearchDialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen} />
    </>
  );
}
