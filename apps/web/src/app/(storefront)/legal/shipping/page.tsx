import { LegalPageShell, PolicySection, PolicyItem } from "@/components/storefront/legal/legal-page-shell";
import type { Metadata } from "next";
import { BRAND_CONFIG } from "@/constants";

export const metadata: Metadata = {
  title: `Shipping Policy | ${BRAND_CONFIG.NAME}`,
  description:
    `${BRAND_CONFIG.NAME}'s shipping policy — delivery timeframes for India and international orders, shipping charges, and delay disclaimers.`,
};

export default function ShippingPage() {
  return (
    <LegalPageShell
      activeHref="/legal/shipping"
      title="Shipping Policy"
      subtitle="We ship across India and internationally. Here's what you need to know about delivery timeframes and charges."
    >
      <PolicySection title="Delivery Timeframes">
        <PolicyItem title="India:">
          3–7 working days from order confirmation.
        </PolicyItem>
        <PolicyItem title="International:">
          7–15 working days from order confirmation.
        </PolicyItem>
      </PolicySection>

      <PolicySection title="Shipping Charges">
        <PolicyItem>
          Charges vary based on delivery location and order value. The exact
          amount will be displayed at checkout before payment.
        </PolicyItem>
      </PolicySection>

      <PolicySection title="Delays">
        <PolicyItem>
          We are not liable for delays caused by courier services or
          circumstances beyond our control (e.g. weather, public holidays, or
          customs clearance for international orders).
        </PolicyItem>
      </PolicySection>
    </LegalPageShell>
  );
}
