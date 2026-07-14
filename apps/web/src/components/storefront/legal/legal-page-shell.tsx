// Server Component — shared layout shell for all legal pages

import Link from "next/link";

// ─── Nav items ────────────────────────────────────────────────────────────────

const LEGAL_NAV = [
  { label: "Terms & Conditions", href: "/legal/terms" },
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Returns & Refunds", href: "/legal/returns" },
  { label: "Shipping Policy", href: "/legal/shipping" },
] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

export function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10">
      <h2 className="font-heading text-2xl font-semibold text-foreground mb-5 pb-3 border-b border-border/60">
        {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

export function PolicyItem({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-foreground/25 mt-[7px]" />
      <div className="text-sm text-muted-foreground leading-relaxed">
        {title && (
          <span className="font-semibold text-foreground">{title} </span>
        )}
        {children}
      </div>
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function LegalPageShell({
  activeHref,
  title,
  subtitle,
  children,
}: {
  activeHref: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-screen bg-background">
      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden bg-foreground text-background py-16 px-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 40px,currentColor 40px,currentColor 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,currentColor 40px,currentColor 41px)",
          }}
        />
        <div className="relative mx-auto max-w-4xl">
          <Link
            href="/legal"
            className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.3em] uppercase text-background/40 hover:text-background/70 transition-colors mb-5"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
              aria-hidden="true"
            >
              <path d="M10 12L6 8l4-4" />
            </svg>
            Legal & Policies
          </Link>
          <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-wide">
            {title}
          </h1>
          <p className="mt-4 text-background/55 text-sm max-w-md leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      {/* ── Inner layout: sidebar + content ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar nav */}
          <aside className="lg:w-52 shrink-0">
            <nav aria-label="Policy sections">
              <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-4">
                All Policies
              </p>
              <ul className="space-y-1">
                {LEGAL_NAV.map(({ label, href }) => {
                  const isActive = href === activeHref;
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={isActive ? "page" : undefined}
                        className={
                          isActive
                            ? "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-foreground text-background"
                            : "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        }
                      >
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {children}

            {/* Last updated */}
            <p className="mt-12 text-xs text-muted-foreground/60 border-t border-border pt-6">
              Last updated: May 2025 &mdash; For queries, contact us at{" "}
              <a
                href="tel:+919641472617"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                +91 9641472617
              </a>{" "}
              or{" "}
              <a
                href="https://wa.me/919641472617"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                WhatsApp
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
