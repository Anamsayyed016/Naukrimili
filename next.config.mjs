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
  // ESLint is disabled during builds in Next.js 16+ by default
  // Use 'npm run lint' for code quality checks during development
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
    // Disable outputFileTracing to prevent build hangs on large projects
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core*',
        'node_modules/webpack*',
        'node_modules/.cache*',
      ],
    },
  },
  // CRITICAL: Remove turbopack config when using --webpack flag
  // Having both causes build conflicts and hangs
  // turbopack: {}, // REMOVED - conflicts with --webpack flag
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
  webpack: (config, { isServer }) => {
    // CRITICAL: Minimal webpack config - only essential to prevent hangs
    
    // Basic resolve setup
    if (!config.resolve) config.resolve = {};
    if (!config.resolve.alias) config.resolve.alias = {};
    
    // Set @ alias
    if (!config.resolve.alias['@']) {
      config.resolve.alias['@'] = path.resolve(process.cwd());
    }
    
    // Alias node: imports (essential for compatibility)
    Object.assign(config.resolve.alias, {
      'node:fs': 'fs', 'node:path': 'path', 'node:os': 'os', 'node:crypto': 'crypto',
      'node:buffer': 'buffer', 'node:util': 'util', 'node:stream': 'stream',
      'node:http': 'http', 'node:https': 'https', 'node:net': 'net', 'node:tls': 'tls',
      'node:url': 'url', 'node:zlib': 'zlib', 'node:assert': 'assert',
      'node:child_process': 'child_process', 'node:events': 'events',
      'node:querystring': 'querystring', 'node:string_decoder': 'string_decoder',
      'node:punycode': 'punycode',
    });
    
    // Server-side externals
    if (isServer) {
      if (!config.externals) config.externals = [];
      if (typeof config.externals === 'object' && !Array.isArray(config.externals)) {
        config.externals = [config.externals];
      }
      config.externals.push({
        'puppeteer': 'commonjs puppeteer',
        'puppeteer-core': 'commonjs puppeteer-core',
      });
    }
    
    // Client-side: Prevent server-only modules
    if (!isServer) {
      if (!config.resolve.fallback) config.resolve.fallback = {};
      ['fs', 'net', 'tls', 'crypto', 'stream', 'url', 'zlib', 'http', 'https', 
       'http2', 'assert', 'os', 'path', 'child_process', 'buffer', 'util', 
       'events', 'querystring', 'punycode', 'string_decoder'].forEach(module => {
        config.resolve.fallback[module] = false;
        config.resolve.fallback[`node:${module}`] = false;
      });
      
      if (!config.externals) config.externals = [];
      config.externals.push({
        '@prisma/client': 'commonjs @prisma/client',
        'prisma': 'commonjs prisma',
        '.prisma/client': 'commonjs .prisma/client',
      });
      
      // Prevent Prisma imports on client
      config.resolve.alias['@prisma/client'] = false;
      config.resolve.alias['.prisma/client'] = false;
      config.resolve.alias['prisma'] = false;
      config.resolve.alias['@/lib/prisma'] = false;
      config.resolve.alias['@/lib/auth-utils'] = false;
      config.resolve.alias['@/lib/generated/prisma'] = false;
    }
    
    // CRITICAL: Disable optimization that can cause hangs
    if (!config.optimization) config.optimization = {};
    // Let Next.js handle optimization - don't override
    
    // Disable performance hints
    if (!config.performance) config.performance = {};
    config.performance.hints = false;
    
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
