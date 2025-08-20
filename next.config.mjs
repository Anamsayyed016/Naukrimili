/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance
  reactStrictMode: true,

  // TypeScript and ESLint
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

  // Compiler optimizations
  compiler: {
    removeConsole: true, // Remove all console logs in production
  },

  // Typed routes (moved from experimental in Next.js 15)
  typedRoutes: true,

  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true
  }
};

export default nextConfig;