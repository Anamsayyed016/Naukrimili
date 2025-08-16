/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance
  reactStrictMode: true,

  // TypeScript and ESLint
  // Speed up production builds by skipping heavy checks (CI can enforce)
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Output optimization
  output: 'standalone',
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

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      },
      {
        source: '/images/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' }
        ]
      }
    ];
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true
          }
        }
      };
    }

    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('fs');
    }

    return config;
  },

  // Experimental
  experimental: {
    optimizeCss: true,
    scrollRestoration: true
  },

  // Redirects
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/jobs/search', destination: '/jobs', permanent: false }
    ];
  },

  // Rewrites (placeholder for future)
  async rewrites() {
    return [];
  }
};

export default nextConfig;