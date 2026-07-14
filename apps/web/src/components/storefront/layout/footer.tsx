import Link from "next/link";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { FACEBOOK, INSTAGRAM, BRAND_CONFIG } from "@/constants";

// ─── Inline social SVGs (lucide-react does not ship brand icons) ─────────────

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const LINK_GROUPS: FooterLinkGroup[] = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Terms & Conditions", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Returns & Refunds", href: "/legal/returns" },
      { label: "Shipping Policy", href: "/legal/shipping" },
    ],
  },
];

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: INSTAGRAM,
    Icon: IconInstagram,
  },
  {
    label: "Facebook",
    href: FACEBOOK,
    Icon: IconFacebook,
  },
];

const LEGAL_LINKS = [
  { label: "Terms", href: "/legal/terms" },
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Returns", href: "/legal/returns" },
  { label: "Shipping", href: "/legal/shipping" },
];

// ─── Footer Component (Server Component) ─────────────────────────────────────

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      aria-label="Site footer"
      className="border-t border-border/40 bg-card text-card-foreground"
    >
      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Logo size="lg" />

            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Handcrafted Indian fashion rooted in tradition, refined for the
              modern woman. Every thread tells a story.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow us on ${label}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-all duration-200"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-medium tracking-[0.35em] uppercase text-muted-foreground mb-5">
                {group.title}
              </h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Legal strip ──────────────────────────────────────────────────── */}
      <div className="border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {currentYear} {BRAND_CONFIG.NAME}. All rights reserved.
          </p>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
