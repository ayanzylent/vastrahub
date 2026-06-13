import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  shop: [
    { label: "New Arrivals", href: "/categories/new-arrivals" },
    { label: "Sarees", href: "/categories/sarees" },
    { label: "Lehengas", href: "/categories/lehengas" },
    { label: "Kurtas", href: "/categories/kurtas" },
    { label: "Dupattas", href: "/categories/dupattas" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
    { label: "Blog", href: "/blog" },
  ],
  support: [
    { label: "Help Center", href: "/help" },
    { label: "Shipping", href: "/shipping" },
    { label: "Returns", href: "/returns" },
    { label: "Size Guide", href: "/size-guide" },
    { label: "Track Order", href: "/track" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--border))]/40 bg-[hsl(var(--card))]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Logo size="lg" asLink={false} />
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))] max-w-xs">
              Premium Indian fashion curated for the modern you. Handpicked
              elegance from India&apos;s finest weavers and designers.
            </p>
            {/* Social icons placeholder */}
            <div className="mt-6 flex gap-4">
              {["Instagram", "Twitter", "Facebook"].map((social) => (
                <span
                  key={social}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-xs text-[hsl(var(--muted-foreground))] transition-colors hover:bg-brand-500/20 hover:text-brand-400 cursor-pointer"
                >
                  {social[0]}
                </span>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="font-heading font-semibold text-sm mb-4">Shop</h3>
            <ul className="space-y-2.5">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-sm mb-4">Company</h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-sm mb-4">Support</h3>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8 opacity-40" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            © {new Date().getFullYear()} VastraHub. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
