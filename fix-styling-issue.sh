#!/bin/bash

echo "🔧 Fixing React Hydration and Styling Issues..."

# 1. Clear browser cache and force rebuild
echo "📦 Clearing build cache..."
rm -rf .next
rm -rf node_modules/.cache

# 2. Fix Next.js configuration for proper hydration
echo "⚙️ Updating Next.js configuration..."
cat > next.config.mjs << 'NEXTCONFIG'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    forceSwcTransforms: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/css/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
NEXTCONFIG

# 3. Fix React hydration by updating package.json
echo "📦 Updating React configuration..."
npm install --save-dev @next/bundle-analyzer

# 4. Clear all caches
echo "🧹 Clearing all caches..."
npm cache clean --force
rm -rf .next/cache

# 5. Rebuild with clean environment
echo "🔨 Building application..."
NODE_ENV=production npm run build

# 6. Restart application
echo "🚀 Restarting application..."
pm2 restart naukrimili

echo "✅ Styling fix script completed!"
echo "🌐 Check your website now: https://naukrimili.com"
