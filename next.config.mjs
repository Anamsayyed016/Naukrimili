/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // NOTE: Removed output: 'export' because the project uses Next.js Route Handlers under /app/api
  // Static HTML export does NOT support API routes or server features. Keeping it caused build failures:
  //   Failed to collect page data for /api/admin ... with "output: export"
  // If you truly need a static export for marketing pages only, create a separate config
  // or gate this with an env var, e.g.:
  // output: process.env.STATIC_EXPORT === 'true' ? 'export' : undefined
  // For Hostinger deployment with Node runtime, a normal server build is required.
};

export default nextConfig;