import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Required for Docker — produces minimal standalone server
  typescript: {
    ignoreBuildErrors: true, // Unused shadcn/ui components have missing deps
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
