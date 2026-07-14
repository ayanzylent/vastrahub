// Server Component — no "use client" needed

import Link from "next/link";
import { buildWhatsAppUrl, PHONE_NUMBER, BRAND_CONFIG } from "@/constants";

// ─── Icon helpers ──────────────────────────────────────────────────────────────

function IconMapPin({ className }: { className?: string }) {
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
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
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
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 11 19.79 19.79 0 0 1 1.61 2.34 2 2 0 0 1 3.59.16h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 7.91a16 16 0 0 0 6.08 6.08l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function IconBuilding({ className }: { className?: string }) {
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
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function ContactCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 hover:border-foreground/20 transition-colors duration-300">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-foreground/70 group-hover:bg-foreground group-hover:text-background transition-all duration-300">
        {icon}
      </div>
      <div>
        <h3 className="text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-2">
          {title}
        </h3>
        <div className="text-sm text-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContactPageContent() {
  return (
    <section className="min-h-screen bg-background">
      {/* ── Hero ── */}
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
            Get in Touch
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-wide">
            Contact Us
          </h1>
          <p className="mt-4 text-background/55 text-sm max-w-md mx-auto leading-relaxed">
            We&apos;d love to hear from you. Reach out for orders, exchanges, or
            anything else — we typically respond within a few hours.
          </p>
        </div>
      </div>

      {/* ── Contact cards ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <ContactCard
            icon={<IconPhone className="h-5 w-5" />}
            title="Phone"
          >
            <a
              href={`tel:${PHONE_NUMBER}`}
              id="contact-phone-link"
              className="hover:underline underline-offset-2"
            >
              {PHONE_NUMBER}
            </a>
          </ContactCard>

          <ContactCard
            icon={<IconWhatsApp className="h-5 w-5" />}
            title="WhatsApp"
          >
            <a
              href={buildWhatsAppUrl('')}
              id="contact-whatsapp-link"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline underline-offset-2"
            >
              Chat with us on WhatsApp
            </a>
            <p className="text-xs text-muted-foreground mt-1">
              Typically responds within a few hours
            </p>
          </ContactCard>

          <ContactCard
            icon={<IconMapPin className="h-5 w-5" />}
            title="Store Address"
          >
            22, Rabindra Sarani, opp. Brojobala Girls&apos; High School,
            Ranaghat, Nadia, West Bengal – 741201
          </ContactCard>
        </div>

        {/* ── Map embed placeholder ── */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-border h-72 bg-secondary flex items-center justify-center">
          <a
            href="https://maps.google.com/?q=22+Rabindra+Sarani+Ranaghat+West+Bengal"
            target="_blank"
            rel="noopener noreferrer"
            id="contact-map-link"
            className="flex flex-col items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconMapPin className="h-10 w-10 opacity-30" />
            <span className="text-sm font-medium">View on Google Maps</span>
            <span className="text-xs opacity-60">
              22, Rabindra Sarani, Ranaghat, West Bengal
            </span>
          </a>
        </div>

        {/* ── Business info ── */}
        <div className="mt-10 rounded-2xl border border-border bg-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <IconBuilding className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-heading text-xl font-semibold">
              Business Information
            </h2>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            {[
              { label: "Business Name", value: BRAND_CONFIG.NAME },
              { label: "GSTIN", value: "19ACGFA6235R1ZR" },
              { label: "Phone", value: PHONE_NUMBER },
              {
                label: "Address",
                value:
                  "22, Rabindra Sarani, opp. Brojobala Girls' High School, Ranaghat, Nadia, West Bengal – 741201, India",
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">
                  {label}
                </dt>
                <dd className="text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── Help links ── */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Looking for our policies?{" "}
          <Link
            href="/legal"
            className="font-medium text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            Read our Terms, Privacy &amp; Shipping policies →
          </Link>
        </p>
      </div>
    </section >
  );
}
