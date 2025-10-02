/** @type {import('next').NextConfig} */
// FORCE HASH CHANGE - Build timestamp: 2025-01-02 15:30:00
const BUILD_TIMESTAMP = Date.now();
const nextConfig = {
  // Performance
  reactStrictMode: true,

  // TypeScript and ESLint
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Output optimization
  // output: 'standalone',
  trailingSlash: false,

  // Image optimization
  images: {
    domains: ['aftionix.in', 'localhost'],
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },

  // Compression and headers
  compress: true,
  poweredByHeader: false,
  
  // Custom headers for cache busting
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },

  // Compiler optimizations
  compiler: {
    removeConsole: true, // Remove all console logs in production
  },

  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true
  },

  // Webpack configuration for cache busting
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Force new chunk names with timestamp
      config.output.chunkFilename = `static/chunks/[name]-${BUILD_TIMESTAMP}.[contenthash].js`;
      config.output.filename = `static/chunks/[name]-${BUILD_TIMESTAMP}.[contenthash].js`;
      
      // Optimize chunk splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            name: `chunk-${BUILD_TIMESTAMP}`,
            chunks: 'async',
            priority: 10,
            reuseExistingChunk: true,
          },
          vendor: {
            name: `vendor-${BUILD_TIMESTAMP}`,
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: 20,
          },
        },
      };
    }
    
    return config;
  },
};

export default nextConfig;
