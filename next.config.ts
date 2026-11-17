import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep the dev-only badge away from the mobile bottom tab bar
  devIndicators: { position: "top-right" },
  // Dev only: on Windows we open the site at 127.0.0.1 (localhost can stall on IPv6).
  // Next 16 refuses dev connections from hosts not listed here, and the page then never hydrates.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
