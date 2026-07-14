import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_CONFIG } from "@/constants";

export const metadata: Metadata = {
  title: `Legal & Policies | ${BRAND_CONFIG.NAME}`,
  description:
    `Read ${BRAND_CONFIG.NAME}'s Terms & Conditions, Privacy Policy, Return & Refund Policy, and Shipping Policy.`,
};

const POLICIES = [
  {
    href: "/legal/terms",
    label: "Terms & Conditions",
    description:
      "Product information, order confirmation, pricing, intellectual property, and cancellation.",
    id: "legal-terms",
  },
  {
    href: "/legal/privacy",
    label: "Privacy Policy",
    description:
      "How we collect, use, and protect your personal data, and your rights.",
    id: "legal-privacy",
  },
  {
    href: "/legal/returns",
    label: "Return, Refund & Exchange",
    description:
      "Exchange window, conditions, damaged goods reporting, and refund timelines.",
    id: "legal-returns",
  },
  {
    href: "/legal/shipping",
    label: "Shipping Policy",
    description:
      "Delivery timeframes for India & international orders, shipping charges, and delays.",
    id: "legal-shipping",
  },
] as const;

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
      aria-hidden="true"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export default function LegalIndexPage() {
  return (
    <section className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden bg-foreground text-background py-16 px-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 40px,currentColor 40px,currentColor 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,currentColor 40px,currentColor 41px)",
          }}
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-[10px] tracking-[0.4em] uppercase text-background/40 mb-4">
            {BRAND_CONFIG.NAME}
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-wide">
            Legal &amp; Policies
          </h1>
          <p className="mt-4 text-background/55 text-sm max-w-md mx-auto leading-relaxed">
            Transparency is at the heart of everything we do. Please read our
            policies carefully.
          </p>
        </div>
      </div>

      {/* Policy cards */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <ul className="space-y-4">
          {POLICIES.map(({ href, label, description, id }) => (
            <li key={href}>
              <Link
                href={href}
                id={id}
                className="group flex items-center justify-between gap-6 rounded-2xl border border-border bg-card p-6 hover:border-foreground/25 hover:shadow-sm transition-all duration-200"
              >
                <div>
                  <h2 className="font-heading text-lg font-semibold text-foreground mb-1">
                    {label}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
                <ArrowRight />
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-12 text-center text-xs text-muted-foreground/60">
          For questions about any policy, call or WhatsApp us at{" "}
          <a
            href="tel:+919641472617"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            +91 9641472617
          </a>
          .
        </p>
      </div>
    </section>
  );
}
