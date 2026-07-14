import type { Metadata } from "next";
import { ContactPageContent } from "@/components/storefront/contact/contact-page-content";
import { BRAND_CONFIG } from "@/constants";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    `Get in touch with ${BRAND_CONFIG.NAME}. Call or WhatsApp us at +91 9641472617 or visit our store in Ranaghat, West Bengal.`,
};

export default function ContactPage() {
  return <ContactPageContent />;
}
