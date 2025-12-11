import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Ensure server-side packages work correctly
  serverExternalPackages: ['pdf2json', '@huggingface/transformers', 'onnxruntime-node'],
  // Empty turbopack config to use Turbopack (Next.js 16 default)
  turbopack: {},
};

export default nextConfig;
