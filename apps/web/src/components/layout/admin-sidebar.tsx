"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Ticket,
  Star,
  Settings,
  ChevronLeft,
  FolderTree,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth-client";

const sidebarLinks = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Users", href: "/admin/users", icon: Shield, superadminOnly: true },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: sessionData } = useSession();
  const user = sessionData?.user;

  const filteredLinks = sidebarLinks.filter(
    (link) => !link.superadminOnly || user?.role === 'superadmin'
  );

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r border-[hsl(var(--border))]/40 bg-[hsl(var(--card))] transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className={cn("flex h-16 items-center px-4", collapsed && "justify-center")}>
        {collapsed ? (
          <span className="text-xl font-bold gradient-text">V</span>
        ) : (
          <Logo size="md" />
        )}
      </div>

      <Separator className="opacity-40" />

      {/* Nav Links */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-2">
          {filteredLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-brand-500/10 text-brand-400 shadow-sm"
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent-ui))] hover:text-[hsl(var(--foreground))]"
                )}
                title={collapsed ? link.label : undefined}
              >
                <link.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Role Badge */}
      {!collapsed && user?.role && (
        <div className="px-3 pb-2">
          <Badge
            className={cn(
              "w-full justify-center border-transparent",
              user.role === 'superadmin'
                ? 'bg-purple-500/10 text-purple-400'
                : 'bg-blue-500/10 text-blue-400'
            )}
          >
            {user.role === 'superadmin' ? 'Super Admin' : 'Admin'}
          </Badge>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="border-t border-[hsl(var(--border))]/40 p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-1 text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
