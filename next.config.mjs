/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    forceSwcTransforms: true,
  },
  serverExternalPackages: ['googleapis', 'google-auth-library', 'nodemailer'],
  // Increase body size limit for file uploads (10MB)
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle Node.js modules on client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        http2: false,
        assert: false,
        os: false,
        path: false,
        child_process: false,
        'node:buffer': false,
        'node:fs': false,
        'node:http': false,
        'node:https': false,
        'node:stream': false,
      };
      
      // Ignore googleapis and related packages in client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'googleapis': 'commonjs googleapis',
        'google-auth-library': 'commonjs google-auth-library',
        'node-fetch': 'commonjs node-fetch',
      });
    }
    return config;
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
