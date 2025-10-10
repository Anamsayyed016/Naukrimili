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
    domains: ['naukrimili.com', 'localhost'],
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
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
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
        source: '/((?!_next/static).*)',
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

  // Experimental features for performance - REMOVED optimizeCss to fix CSS loading
  experimental: {
    scrollRestoration: true
  },

  // Minimal webpack configuration to avoid CSS loading issues
  webpack: (config, { dev, isServer, webpack }) => {
    // Don't interfere with Next.js CSS handling - let it handle CSS files naturally
    
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
