import type { Metadata } from "next";
import { NO_INDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NO_INDEX_METADATA,
  title: "Checkout",
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
