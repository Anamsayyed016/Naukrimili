/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hostinger deployment optimizations
  output: 'standalone',
  trailingSlash: false,
  poweredByHeader: false,
  
  // Image optimization for Hostinger
  images: {
    domains: [
      'localhost',
      'naukrimili.com',
      'www.naukrimili.com',
      'images.unsplash.com',
      'via.placeholder.com',
      'avatars.githubusercontent.com'
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Environment variables for Hostinger
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Experimental features
  experimental: {
    typedRoutes: true,
    serverComponentsExternalPackages: ['mongoose'],
  },

  // Webpack configuration for Hostinger
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Handle PDF.js for resume parsing
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?js/,
      type: 'asset/resource',
      generator: {
        filename: 'static/worker/[hash][ext][query]',
      },
    });

    return config;
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },

  // Redirects for Hostinger
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Rewrites for API compatibility
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health',
      },
    ];
  },

  // Compression for better performance
  compress: true,

  // Production optimizations
  swcMinify: true,
  
  // Disable x-powered-by header
  poweredByHeader: false,
};

export default nextConfig;
