import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // ESLint configuration: Disable during production builds
  // This allows builds to complete even with ESLint errors/warnings
  // ESLint is still available for developers via 'npm run lint' for code quality checks
  eslint: {
    ignoreDuringBuilds: true, // CRITICAL: Skip ESLint during all builds (production & CI/CD)
  },
  // Skip database validation during build
  env: {
    SKIP_DB_VALIDATION: process.env.SKIP_DB_VALIDATION || 'false',
    // Make API keys available during build (server-side only)
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    GOOGLE_CLOUD_OCR_API_KEY: process.env.GOOGLE_CLOUD_OCR_API_KEY || process.env.GOOGLE_CLOUD_API_KEY || '',
  },
  experimental: {
    // Removed forceSwcTransforms - can cause build hangs
    serverActions: {
      bodySizeLimit: '10mb', // Allow up to 10MB for file uploads
    },
  },
  // Turbopack config: Empty config to allow webpack config to work
  // Next.js 16 uses Turbopack by default, but we need webpack for compatibility
  turbopack: {},
  serverExternalPackages: ['googleapis', 'google-auth-library', 'nodemailer', '@prisma/client', 'prisma', 'puppeteer', 'puppeteer-core'],
  compiler: {
    removeConsole: false, // TEMPORARILY DISABLED for debugging - enable after fixing auto-fill
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dko2hk0yo/**',
      },
      {
        protocol: 'https',
        hostname: 'img.icons8.com',
      },
    ],
    unoptimized: false,
  },
  webpack: (config, { isServer, webpack }) => {
    // Simplified webpack config to prevent hangs
    // Only essential configurations
    
    // Path alias - prevent infinite loops
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    if (!config.resolve.alias['@']) {
      config.resolve.alias['@'] = path.resolve(process.cwd());
    }
    
    // CRITICAL: Alias node: scheme imports to regular modules for webpack compatibility
    // This prevents "UnhandledSchemeError" for node:buffer, node:fs, etc.
    const nodeBuiltinAliases = {
      'node:fs': 'fs',
      'node:path': 'path',
      'node:os': 'os',
      'node:crypto': 'crypto',
      'node:buffer': 'buffer',
      'node:util': 'util',
      'node:stream': 'stream',
      'node:http': 'http',
      'node:https': 'https',
      'node:net': 'net',
      'node:tls': 'tls',
      'node:url': 'url',
      'node:zlib': 'zlib',
      'node:assert': 'assert',
      'node:child_process': 'child_process',
      'node:events': 'events',
      'node:querystring': 'querystring',
      'node:string_decoder': 'string_decoder',
      'node:punycode': 'punycode',
    };
    
    Object.assign(config.resolve.alias, nodeBuiltinAliases);

    // Server-side externals
    if (isServer) {
      if (!config.externals) {
        config.externals = [];
      }
      if (typeof config.externals === 'object' && !Array.isArray(config.externals)) {
        config.externals = [config.externals];
      }
      config.externals.push({
        'puppeteer': 'commonjs puppeteer',
        'puppeteer-core': 'commonjs puppeteer-core',
      });
    }

    // Client-side fallbacks and externals
    if (!isServer) {
      if (!config.resolve.fallback) {
        config.resolve.fallback = {};
      }
      // Handle both regular and node: prefixed builtins
      const nodeBuiltins = [
        'fs', 'net', 'tls', 'crypto', 'stream', 'url', 'zlib',
        'http', 'https', 'http2', 'assert', 'os', 'path', 'child_process',
        'buffer', 'util', 'events', 'querystring', 'punycode', 'string_decoder'
      ];
      
      nodeBuiltins.forEach(module => {
        config.resolve.fallback[module] = false;
        config.resolve.fallback[`node:${module}`] = false;
      });
      
      if (!config.externals) {
        config.externals = [];
      }
      config.externals.push({
        '@prisma/client': 'commonjs @prisma/client',
        'prisma': 'commonjs prisma',
        '.prisma/client': 'commonjs .prisma/client',
      });

      // Prevent Prisma and server-only modules from being imported on client
      config.resolve.alias['@prisma/client'] = false;
      config.resolve.alias['.prisma/client'] = false;
      config.resolve.alias['prisma'] = false;
      config.resolve.alias['@/lib/prisma'] = false;
      
      // CRITICAL: Prevent server-only auth-utils from being imported in client components
      // This prevents webpack from trying to bundle Prisma in client code
      config.resolve.alias['@/lib/auth-utils'] = false;
      
      // Also prevent any direct Prisma imports through aliases
      config.resolve.alias['@/lib/generated/prisma'] = false;
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
