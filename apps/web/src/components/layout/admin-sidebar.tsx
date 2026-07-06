"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Ticket,
  Star,
  Settings,
  FolderTree,
  LayoutGrid,
  Shield,
  Store,
  LogOut,
  ChevronsUpDown,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSession, signOut } from "@/lib/auth-client";
import { toast } from "sonner";
import { BRAND_CONFIG } from "@vastrahub/shared-constants";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  superadminOnly?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Categories", href: "/admin/categories", icon: FolderTree },
      { label: "Collections", href: "/admin/collections", icon: LayoutGrid },
      { label: "Products", href: "/admin/products", icon: Package },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Coupons", href: "/admin/coupons", icon: Ticket },
      { label: "Reviews", href: "/admin/reviews", icon: Star },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Users", href: "/admin/users", icon: Shield, superadminOnly: true },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const { data: sessionData } = useSession();
  const user = sessionData?.user;
  const isSuperadmin = user?.role === "superadmin";

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    router.push("/login");
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="font-heading text-sm font-bold">{BRAND_CONFIG.NAME.charAt(0)}</span>
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-heading font-semibold">
                    {BRAND_CONFIG.NAME}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Admin Console
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => {
          const items = group.items.filter(
            (item) => !item.superadminOnly || isSuperadmin
          );
          if (items.length === 0) return null;

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarMenu>
                {items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname?.startsWith(item.href + "/");
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link
                          href={item.href}
                          onClick={() => {
                            if (isMobile) setOpenMobile(false);
                          }}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage
                      src={user?.image || ""}
                      alt={user?.name || "Admin"}
                    />
                    <AvatarFallback className="rounded-lg bg-sidebar-primary/15 text-sidebar-primary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user?.name || "Admin"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email || BRAND_CONFIG.DEFAULT_ADMIN_EMAIL}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarImage
                        src={user?.image || ""}
                        alt={user?.name || "Admin"}
                      />
                      <AvatarFallback className="rounded-lg bg-sidebar-primary/15 text-sidebar-primary text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {user?.name || "Admin"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email || BRAND_CONFIG.DEFAULT_ADMIN_EMAIL}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user?.role && (
                  <>
                    <div className="px-2 py-1.5">
                      <Badge
                        className={
                          isSuperadmin
                            ? "border-transparent bg-primary/10 text-primary"
                            : "border-transparent bg-muted text-muted-foreground"
                        }
                      >
                        {isSuperadmin ? "Super Admin" : "Admin"}
                      </Badge>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <Store className="mr-2 size-4" />
                    Storefront
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">
                    <Settings className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
