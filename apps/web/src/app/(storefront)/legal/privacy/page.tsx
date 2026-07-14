import { LegalPageShell, PolicySection, PolicyItem } from "@/components/storefront/legal/legal-page-shell";
import type { Metadata } from "next";
import { BRAND_CONFIG } from "@/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    `Understand how ${BRAND_CONFIG.NAME} collects, uses, and protects your personal data, including payment security and your rights.`,
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      activeHref="/legal/privacy"
      title="Privacy Policy"
      subtitle="We are committed to protecting your privacy and handling your data with care and transparency."
    >
      <PolicySection title="Information We Collect">
        <PolicyItem>
          We collect your name, phone number, delivery address, order details,
          and communication history.
        </PolicyItem>
      </PolicySection>

      <PolicySection title="How We Use Your Information">
        <PolicyItem>
          Your information is used for order processing, delivery, and customer
          support. Promotional updates are sent only with your consent.
        </PolicyItem>
      </PolicySection>

      <PolicySection title="Data Protection">
        <PolicyItem>
          Your personal data is kept secure and is never sold or shared with
          third parties, except where required by delivery partners or applicable
          law.
        </PolicyItem>
      </PolicySection>

      <PolicySection title="Payment Security">
        <PolicyItem>
          We do not store payment information. All transactions are processed
          through secure payment gateways.
        </PolicyItem>
      </PolicySection>

      <PolicySection title="Your Rights">
        <PolicyItem>
          You may request to update or delete your personal data at any time by
          contacting us directly.
        </PolicyItem>
      </PolicySection>
    </LegalPageShell>
  );
}
