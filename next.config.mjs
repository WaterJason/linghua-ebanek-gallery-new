/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Remove fallbackNodePolyfills as it's not a valid option
  },
  webpack: (config, { isServer }) => {
    // Fix for ChunkLoadError
    config.output.chunkFilename = isServer
      ? `[name].js`
      : `static/chunks/[name].[contenthash].js`;

    return config;
  },
}

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);

export default pwaConfig;
