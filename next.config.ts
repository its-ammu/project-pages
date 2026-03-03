import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Disable Strict Mode to avoid Supabase auth lock issues (double mount in dev) */
  reactStrictMode: false,
};

export default nextConfig;
