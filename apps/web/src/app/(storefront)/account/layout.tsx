import type { Metadata } from "next";
import { AccountLayoutClient } from "@/components/storefront/account/account-layout-client";
import { NO_INDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NO_INDEX_METADATA,
  title: "Account",
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountLayoutClient>{children}</AccountLayoutClient>;
}
