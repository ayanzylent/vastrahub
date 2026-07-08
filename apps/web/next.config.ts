import type { NextConfig } from "next";

/**
 * API Proxy Strategy (for mobile browser auth compatibility)
 *
 * Problem:  Frontend (Vercel) and Backend (Render) are on different domains.
 *           Mobile Safari blocks cross-site cookies (SameSite=None) via ITP,
 *           breaking cookie-based auth on mobile browsers.
 *
 * Solution: Proxy /api requests through Next.js rewrites so the browser only
 *           talks to one domain — cookies become first-party and work everywhere.
 *
 * Config:   Set NEXT_PUBLIC_API_PROXY="true" to enable proxying (current setup).
 *
 * ── Migration to custom domains (app.vastrahub.com + api.vastrahub.com) ──
 * When you set up custom subdomains sharing a root domain:
 *   1. Remove NEXT_PUBLIC_API_PROXY (or set to "false")
 *   2. Set NEXT_PUBLIC_API_URL to your backend's custom domain (e.g. https://api.vastrahub.com)
 *   3. Update the server's auth.plugin.ts to use crossSubDomainCookies (see comments there)
 *   4. Cookies become first-party via shared root domain — no proxy needed.
 */
const useApiProxy = process.env.NEXT_PUBLIC_API_PROXY === "true";
const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudflare.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      }
    ],
  },

  serverExternalPackages: ["better-auth"],

  // Proxy /api/* through Next.js to the backend to avoid cross-origin cookies.
  // Only active when NEXT_PUBLIC_API_PROXY="true".
  async rewrites() {
    if (!useApiProxy) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
