import type { NextConfig } from "next";

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
        hostname: 'assets.myntassets.com',
      }
    ],
  },
  transpilePackages: [
    "@vastrahub/shared-types",
    "@vastrahub/shared-constants",
  ],
  serverExternalPackages: ["better-auth"],
};

export default nextConfig;
