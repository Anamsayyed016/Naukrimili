/** @type {import('next').NextConfig} */
// FORCE HASH CHANGE - Build timestamp: 2025-01-02 15:30:00
// Aggressive cache busting for production deployments
const BUILD_TIMESTAMP = Date.now();
const DEPLOYMENT_ID = process.env.NEXT_PUBLIC_DEPLOYMENT_ID || Date.now();
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
  
  // Aggressive cache busting headers for production
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'X-Build-Timestamp',
            value: BUILD_TIMESTAMP.toString(),
          },
          {
            key: 'X-Deployment-ID',
            value: DEPLOYMENT_ID.toString(),
          },
        ],
      },
      {
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'X-Build-Timestamp',
            value: BUILD_TIMESTAMP.toString(),
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
          {
            key: 'X-Build-Timestamp',
            value: BUILD_TIMESTAMP.toString(),
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

  // Webpack configuration for aggressive cache busting
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Force completely new chunk names with unique identifiers
      const CHUNK_VERSION = process.env.NEXT_PUBLIC_CHUNK_VERSION || Date.now();
      const RANDOM_ID = Math.random().toString(36).substring(7);
      
      // Override Next.js default chunk naming
      config.output.chunkFilename = `static/chunks/[name]-${CHUNK_VERSION}-${RANDOM_ID}.[contenthash].js`;
      config.output.filename = `static/chunks/[name]-${CHUNK_VERSION}-${RANDOM_ID}.[contenthash].js`;
      
      // Force new chunk splitting with unique names
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: Infinity,
        maxAsyncRequests: Infinity,
        cacheGroups: {
          default: {
            name: `chunk-${CHUNK_VERSION}-${RANDOM_ID}`,
            chunks: 'async',
            priority: 10,
            reuseExistingChunk: false, // Force new chunks
          },
          vendor: {
            name: `vendor-${CHUNK_VERSION}-${RANDOM_ID}`,
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: false, // Force new chunks
          },
          framework: {
            name: `framework-${CHUNK_VERSION}-${RANDOM_ID}`,
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            chunks: 'all',
            priority: 30,
            reuseExistingChunk: false,
          },
        },
      };
      
      // Disable chunk caching
      config.cache = false;
      
      // Force new module IDs
      config.optimization.moduleIds = 'deterministic';
      config.optimization.chunkIds = 'deterministic';
    }
    
    return config;
  },
};

export default nextConfig;
