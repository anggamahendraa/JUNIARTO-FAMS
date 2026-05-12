import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // All pages need runtime env vars (Supabase), so we skip static prerendering
  experimental: {
    // Next.js 16 compatibility
  },
};

export default nextConfig;
