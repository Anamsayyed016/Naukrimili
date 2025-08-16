/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    typedRoutes: false,
  },
  // Completely disable static generation
  output: 'standalone',
  trailingSlash: false,
  // Force all pages to be dynamic
  staticPageGenerationTimeout: 0,
  // Disable static optimization
  optimizeFonts: false,
  compress: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;