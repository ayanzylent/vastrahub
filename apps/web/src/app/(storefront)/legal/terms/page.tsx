import { LegalPageShell, PolicySection, PolicyItem } from "@/components/storefront/legal/legal-page-shell";
import type { Metadata } from "next";
import { BRAND_CONFIG } from "@/constants";

export const metadata: Metadata = {
  title: `Terms & Conditions | ${BRAND_CONFIG.NAME}`,
  description:
    `Read ${BRAND_CONFIG.NAME}'s Terms & Conditions covering product information, order confirmation, pricing, intellectual property, and cancellation policy.`,
};

export default function TermsPage() {
  return (
    <LegalPageShell
      activeHref="/legal/terms"
      title="Terms & Conditions"
      subtitle={`By accessing or purchasing from ${BRAND_CONFIG.NAME}, you agree to the following terms.`}
    >
      <PolicySection title="Product Information">
        <PolicyItem>
          We make every effort to display product colors and details accurately.
          Minor variations may occur due to screen settings or lighting
          conditions.
        </PolicyItem>
      </PolicySection>

      <PolicySection title="Order Confirmation">
        <PolicyItem>
          An order is considered confirmed only after successful payment or
          written confirmation via WhatsApp or phone call.
        </PolicyItem>
      </PolicySection>

      <PolicySection title="Pricing">
        <PolicyItem>
          All prices are subject to change without prior notice.
        </PolicyItem>
      </PolicySection>

      <PolicySection title="Intellectual Property">
        <PolicyItem>
          All images, videos, and content published by {BRAND_CONFIG.NAME} are our
          exclusive property. Unauthorized use or reproduction is strictly
          prohibited.
        </PolicyItem>
      </PolicySection>

      <PolicySection title="Cancellation">
        <PolicyItem>
          Orders cannot be cancelled once they have been dispatched.
        </PolicyItem>
      </PolicySection>
    </LegalPageShell>
  );
}
