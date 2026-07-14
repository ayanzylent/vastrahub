import type { Metadata } from "next";
import { AboutPageContent } from "@/components/storefront/about/about-page-content";
import { BRAND_CONFIG } from "@/constants";

export const metadata: Metadata = {
  title: `About Us | ${BRAND_CONFIG.NAME}`,
  description:
    `Learn about ${BRAND_CONFIG.NAME} — a homegrown fashion brand rooted in Ranaghat, West Bengal, celebrating elegance, individuality, and craftsmanship.`,
};

export default function AboutPage() {
  return <AboutPageContent />;
}
