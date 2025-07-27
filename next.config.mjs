/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow file uploads
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Maximum file size
    },
    responseLimit: '12mb',
  },
  output: 'standalone',
  poweredByHeader: false,
  experimental: {
    serverActions: true
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
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
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Content Security Policy
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  
  // Build configuration
  eslint: {
    ignoreDuringBuilds: false, // Enable ESLint during builds
    dirs: ['app', 'components', 'lib', 'types'],
  },
  
  typescript: {
    ignoreBuildErrors: false, // Enable TypeScript checking
  },
  
  // Image optimization
  images: {
    domains: ['localhost', 'example.com'], // Restrict allowed domains
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Security: Disable Node.js polyfills in client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        sideEffects: false,
      };
    }
    
    return config;
  },
  
  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
  },
  
  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
    typedRoutes: true,
  },
  
  // Output configuration for Vercel
  output: 'standalone',
  
  // Compression
  compress: true,
  
  // Power by header removal
  poweredByHeader: false,
  
  // Strict mode
  reactStrictMode: true,
  
  // SWC minification
  swcMinify: true,
}

export default nextConfig
