/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for production builds
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    // Enable faster builds
    esmExternals: true,
    serverComponentsExternalPackages: ['mongoose', 'pg'],
  },
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }

    // Faster builds
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    return config;
  },

  // Output optimizations
  output: 'standalone',
  
  // Disable telemetry for faster builds
  telemetry: false,
  
  // Optimize bundle analyzer
  bundleAnalyzer: {
    enabled: process.env.ANALYZE === 'true',
  },

  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
