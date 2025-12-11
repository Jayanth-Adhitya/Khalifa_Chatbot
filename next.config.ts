import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Ensure server-side packages work correctly
  serverExternalPackages: ['pdf2json', '@huggingface/transformers', 'onnxruntime-node'],
  // Webpack config for transformers.js
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'sharp$': false,
      'onnxruntime-node$': false,
    };
    return config;
  },
};

export default nextConfig;
