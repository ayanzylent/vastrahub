import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { inter, outfit } from "@/lib/fonts";
import { Toaster } from "@/components/ui/sonner";
import { AppProviders } from "@/providers/AppProviders";
import { BRAND_CONFIG } from "@/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: BRAND_CONFIG.META_TITLE,
  description: BRAND_CONFIG.META_DESCRIPTION,
  keywords: [
    "Indian fashion",
    "sarees",
    "lehengas",
    "kurtas",
    "ethnic wear",
    "premium",
    "handloom",
  ],
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
