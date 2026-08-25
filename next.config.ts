import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.tebex.io" },
      { protocol: "https", hostname: "cdn.tebex.io" },
      { protocol: "https", hostname: "headless.tebex.io" },
      { protocol: "https", hostname: "**.rbxcdn.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
    ],
  },
};

export default nextConfig;
