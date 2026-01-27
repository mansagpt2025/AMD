import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    turbopack: {
      resolveAlias: {
        '@': './src',
      },
    },
  },
  webpack: (config, { isServer }) => {
    return config;
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
};

export default nextConfig;