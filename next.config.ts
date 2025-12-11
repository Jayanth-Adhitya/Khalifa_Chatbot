import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Ensure server-side code can access the data folder
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
