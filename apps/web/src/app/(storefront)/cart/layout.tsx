import type { Metadata } from "next";
import { NO_INDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NO_INDEX_METADATA,
  title: "Cart",
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
