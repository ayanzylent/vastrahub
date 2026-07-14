import type { Metadata } from "next";
import { ShopPageClient } from "@/components/storefront/catalog/shop-page-client";
import { BRAND_CONFIG } from "@/constants";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Shop",
  description: `Browse the full ${BRAND_CONFIG.NAME} catalog — handcrafted sarees, designer wear, and heritage collections.`,
  path: "/shop",
});

export default function ShopPage() {
  return <ShopPageClient />;
}
