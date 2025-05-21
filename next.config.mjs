/** @type {import('next').NextConfig} */
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

export default nextConfig
