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
  webpack: (config, { isServer, dev }) => {
    // Fix for ChunkLoadError - Enhanced configuration
    if (!isServer) {
      config.output.chunkFilename = dev
        ? 'static/chunks/[name].js'
        : 'static/chunks/[name].[contenthash].js';

      // Improve chunk loading reliability
      config.output.crossOriginLoading = 'anonymous';

      // Optimize chunk splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
          },
        },
      };
    }

    return config;
  },
  // Add retry configuration for chunk loading
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

export default nextConfig
