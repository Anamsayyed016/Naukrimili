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

  // Enhanced webpack configuration for production stability
  webpack: (config, { dev, isServer, webpack }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
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
            enforce: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: -5,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      };
      
      // Ensure proper chunk loading
      config.output.chunkLoadingGlobal = 'webpackChunkjobportal';
      config.output.globalObject = 'self';
    }
    
    // Fix for missing chunks
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      })
    );
    
    // Ensure proper module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
};

export default nextConfig;
