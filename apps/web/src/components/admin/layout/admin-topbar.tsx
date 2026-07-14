"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { cn } from "@/lib/utils";

export function AdminTopbar() {
  const pathname = usePathname();

  // Build breadcrumb from pathname
  const pathParts = pathname?.split("/").filter(Boolean) || [];
  const breadcrumb = pathParts.map((part, i) => ({
    label: part.charAt(0).toUpperCase() + part.slice(1),
    href: "/" + pathParts.slice(0, i + 1).join("/"),
  }));

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-card/80 px-4 backdrop-blur supports-backdrop-filter:bg-card/60 md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />

      {/* Breadcrumb Area */}
      <nav className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-sm">
        {breadcrumb.map((crumb, i) => (
          <span
            key={crumb.href}
            className={cn(
              "flex min-w-0 items-center gap-2",
              // Hide intermediate crumbs on small screens; always keep the leaf.
              i > 0 && i < breadcrumb.length - 1 && "hidden md:flex"
            )}
          >
            {i > 0 && <span className="shrink-0 text-muted-foreground">/</span>}
            {i === breadcrumb.length - 1 ? (
              <span className="truncate font-medium">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="truncate text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right Actions */}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
