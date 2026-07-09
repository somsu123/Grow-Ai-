import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Required for Docker — produces minimal standalone server
};

export default nextConfig;
