import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { inter, outfit } from "@/lib/fonts";
import { Toaster } from "@/components/ui/sonner";
import { AppProviders } from "@/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "VastraHub | Premium Indian Fashion",
  description:
    "Discover premium Indian fashion at VastraHub. Shop handpicked sarees, lehengas, kurtas, and more from India's finest weavers and designers.",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} font-body antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
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
