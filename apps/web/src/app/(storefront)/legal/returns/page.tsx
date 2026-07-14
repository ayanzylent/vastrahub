import { LegalPageShell, PolicySection, PolicyItem } from "@/components/storefront/legal/legal-page-shell";
import type { Metadata } from "next";
import { BRAND_CONFIG } from "@/constants";

export const metadata: Metadata = {
  title: "Return, Refund & Exchange Policy",
  description:
    `Learn about ${BRAND_CONFIG.NAME}'s return, exchange, and refund policy — including exchange window, conditions, damaged goods, and refund timelines.`,
};

export default function ReturnsPage() {
  return (
    <LegalPageShell
      activeHref="/legal/returns"
      title="Return, Refund & Exchange"
      subtitle="We want you to love every purchase. Please read our exchange and refund guidelines carefully."
    >
      <PolicySection title="No Returns">
        <PolicyItem>
          We do not accept returns once a product has been sold.
        </PolicyItem>
      </PolicySection>

      <PolicySection title="Exchange Policy">
        <PolicyItem>
          Exchanges are accepted within{" "}
          <strong className="text-foreground font-semibold">
            2 days of delivery
          </strong>
          . The product must be unused, in its original packaging, with all tags
          intact. Return shipping costs are the customer&apos;s responsibility.
        </PolicyItem>
      </PolicySection>

      <PolicySection title="Damaged or Incorrect Product">
        <PolicyItem>
          If you receive a damaged or wrong item, please report it within{" "}
          <strong className="text-foreground font-semibold">
            24 hours of delivery
          </strong>{" "}
          along with an unboxing video. We will arrange a replacement after
          verification.
        </PolicyItem>
      </PolicySection>

      <PolicySection title="Refunds">
        <PolicyItem>
          Refunds are only issued in cases of stock unavailability or verified
          product issues. Refunds are processed within{" "}
          <strong className="text-foreground font-semibold">
            5–7 business days
          </strong>
          .
        </PolicyItem>
      </PolicySection>
    </LegalPageShell>
  );
}
