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
  },
  // Disable outputFileTracing to prevent build hangs on large projects
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core*',
      'node_modules/webpack*',
      'node_modules/.cache*',
    ],
  },
  // CRITICAL: When using --webpack flag, we must NOT have turbopack config
  // Having both causes build conflicts and hangs
  // turbopack: {}, // REMOVED - conflicts with --webpack flag
  // Note: Use --webpack flag explicitly in build command to avoid Turbopack
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
  // Minimal webpack config - only essential to prevent hangs
  // This minimal config handles node: imports without causing build hangs
  webpack: (config, { isServer }) => {
    // Only set up basic resolve if not already configured
    if (!config.resolve) config.resolve = {};
    if (!config.resolve.alias) config.resolve.alias = {};
    
    // Set @ alias (only if not set to prevent loops)
    if (!config.resolve.alias['@']) {
      config.resolve.alias['@'] = path.resolve(process.cwd());
    }
    
    // CRITICAL: Alias node: imports to prevent UnhandledSchemeError
    // Only add if not already set
    const nodeAliases = {
      'node:fs': 'fs', 'node:path': 'path', 'node:os': 'os', 'node:crypto': 'crypto',
      'node:buffer': 'buffer', 'node:util': 'util', 'node:stream': 'stream',
      'node:http': 'http', 'node:https': 'https', 'node:net': 'net', 'node:tls': 'tls',
      'node:url': 'url', 'node:zlib': 'zlib', 'node:assert': 'assert',
      'node:child_process': 'child_process', 'node:events': 'events',
    };
    
    Object.keys(nodeAliases).forEach(key => {
      if (!config.resolve.alias[key]) {
        config.resolve.alias[key] = nodeAliases[key];
      }
    });
    
    // Server-side externals (only for server builds)
    if (isServer) {
      if (!config.externals) config.externals = [];
      if (typeof config.externals === 'object' && !Array.isArray(config.externals)) {
        config.externals = [config.externals];
      }
      // Only add if not already present
      const hasPuppeteer = Array.isArray(config.externals) 
        ? config.externals.some(ext => typeof ext === 'object' && ext.puppeteer)
        : false;
      if (!hasPuppeteer) {
        config.externals.push({
          'puppeteer': 'commonjs puppeteer',
          'puppeteer-core': 'commonjs puppeteer-core',
        });
      }
    }
    
    // Client-side: Prevent server-only modules (only for client builds)
    if (!isServer) {
      if (!config.resolve.fallback) config.resolve.fallback = {};
      // Only set fallbacks that aren't already set
      const nodeBuiltins = ['fs', 'net', 'tls', 'crypto', 'stream', 'url', 'zlib', 
        'http', 'https', 'assert', 'os', 'path', 'child_process', 'buffer', 'util', 'events'];
      nodeBuiltins.forEach(module => {
        if (config.resolve.fallback[module] === undefined) {
          config.resolve.fallback[module] = false;
        }
      });
      
      // Prevent Prisma imports on client (only if not already set)
      const prismaAliases = {
        '@prisma/client': false,
        '.prisma/client': false,
        'prisma': false,
        '@/lib/prisma': false,
        '@/lib/auth-utils': false,
      };
      Object.keys(prismaAliases).forEach(key => {
        if (config.resolve.alias[key] === undefined) {
          config.resolve.alias[key] = prismaAliases[key];
        }
      });
    }
    
    // Disable performance hints to reduce build overhead
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
