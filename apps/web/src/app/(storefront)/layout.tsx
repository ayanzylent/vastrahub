import { Header } from "@/components/storefront/layout/header";
import { Footer } from "@/components/storefront/layout/footer";
import { AnnouncementBar } from "@/components/storefront/layout/announcement-bar";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
