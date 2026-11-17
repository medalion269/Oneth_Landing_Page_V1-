import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep the dev-only badge away from the mobile bottom tab bar
  devIndicators: { position: "top-right" },
};

export default nextConfig;
