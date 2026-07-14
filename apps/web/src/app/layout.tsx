import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { inter, outfit } from "@/lib/fonts";
import { Toaster } from "@/components/ui/sonner";
import { AppProviders } from "@/providers/AppProviders";
import { BRAND_CONFIG } from "@/constants";
import { getSiteUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: BRAND_CONFIG.META_TITLE,
    template: `%s | ${BRAND_CONFIG.NAME}`,
  },
  description: BRAND_CONFIG.META_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: BRAND_CONFIG.NAME,
    title: BRAND_CONFIG.META_TITLE,
    description: BRAND_CONFIG.META_DESCRIPTION,
    url: getSiteUrl(),
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_CONFIG.META_TITLE,
    description: BRAND_CONFIG.META_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable}`}
    >
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AppProviders>
            {children}
          </AppProviders>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
