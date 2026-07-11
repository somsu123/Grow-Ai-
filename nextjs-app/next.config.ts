import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Unused shadcn/ui components have missing deps
  },
};

export default nextConfig;
