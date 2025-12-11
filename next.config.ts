import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Ensure server-side packages work correctly
  serverExternalPackages: ['pdf2json'],
};

export default nextConfig;
