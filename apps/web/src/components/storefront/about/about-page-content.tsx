import { buildWhatsAppUrl, PHONE_NUMBER, BRAND_CONFIG } from "@/constants";

// ─── Pillar card ───────────────────────────────────────────────────────────────

function Pillar({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-heading text-4xl font-light text-foreground/10 leading-none select-none">
        {number}
      </span>
      <h3 className="font-heading text-lg font-semibold text-foreground">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AboutPageContent() {
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
            Our Story
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-wide">
            About {BRAND_CONFIG.NAME}
          </h1>
          <p className="mt-4 text-background/55 text-sm max-w-md mx-auto leading-relaxed">
            A homegrown fashion brand rooted in the heart of Ranaghat, West
            Bengal.
          </p>
        </div>
      </div>

      {/* ── Brand story ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          {/* Left — story */}
          <div className="space-y-6">
            <h2 className="font-heading text-3xl font-light leading-snug">
              Elegance, individuality &amp;{" "}
              <em className="italic font-light">craftsmanship</em>
            </h2>

            <p className="text-muted-foreground text-sm leading-relaxed">
              {BRAND_CONFIG.NAME} is a homegrown fashion brand rooted in the heart
              of Ranaghat, West Bengal. We bring together carefully curated
              clothing and accessories that celebrate elegance, individuality,
              and craftsmanship – at prices that don&apos;t compromise your
              sense of style.
            </p>

            <p className="text-muted-foreground text-sm leading-relaxed">
              Founded with a passion for design and a deep understanding of our
              customers&apos; tastes, we have grown into a trusted name for
              women seeking contemporary yet culturally resonant fashion.
            </p>

            <p className="text-muted-foreground text-sm leading-relaxed">
              Every piece in our collection reflects our commitment to quality
              fabrics, thoughtful aesthetics, and attention to detail. Whether
              you&apos;re dressing for a festive occasion, a casual outing, or a
              special event – {BRAND_CONFIG.NAME} is your destination for outfits
              that make you feel truly yourself.
            </p>
          </div>

          {/* Right — pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-2">
            <Pillar
              number="01"
              title="Quality Fabrics"
              description="Every fabric is hand-selected for texture, drape, and durability to ensure you look and feel your best."
            />
            <Pillar
              number="02"
              title="Thoughtful Design"
              description="Contemporary silhouettes designed with a deep respect for Indian aesthetics and cultural heritage."
            />
            <Pillar
              number="03"
              title="Honest Pricing"
              description="Beautiful fashion shouldn't come with an unreasonable price tag. We keep our pricing fair and transparent."
            />
            <Pillar
              number="04"
              title="Personal Service"
              description="From browsing to after-sale support, we are always just a WhatsApp message or phone call away."
            />
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="my-16 border-t border-border" />

        {/* ── Location highlight ── */}
        <div className="rounded-2xl bg-secondary px-8 py-10 text-center">
          <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-3">
            Where to Find Us
          </p>
          <p className="font-heading text-2xl font-light text-foreground mb-2">
            Ranaghat, West Bengal
          </p>
          <p className="text-sm text-muted-foreground">
            22, Rabindra Sarani, opp. Brojobala Girls&apos; High School,
            Ranaghat, Nadia – 741201
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`tel:${PHONE_NUMBER}`}
              id="about-phone-link"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-85 transition-opacity"
            >
              Call Us — {PHONE_NUMBER}
            </a>
            <a
              href={buildWhatsAppUrl("Hi")}
              id="about-whatsapp-link"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-border text-foreground text-sm font-medium hover:border-foreground/40 transition-colors"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
