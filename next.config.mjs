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
  webpack: (config, { isServer, webpack }) => {
    // CRITICAL: Simplified webpack config to prevent build hangs
    // Add performance optimizations to prevent hangs
    
    // Prevent infinite loops in resolution
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    
    // Set path alias only if not already set (prevent infinite loops)
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
    
    // CRITICAL: Add performance optimizations to prevent hangs
    if (!config.performance) {
      config.performance = {};
    }
    config.performance.maxAssetSize = 500000; // 500KB
    config.performance.maxEntrypointSize = 500000; // 500KB
    config.performance.hints = false; // Disable performance hints during build

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
    
    // CRITICAL: Add cache configuration to prevent hangs
    if (!config.cache) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    
    // CRITICAL: Optimize module resolution to prevent infinite loops
    config.resolve.symlinks = false; // Disable symlink resolution (can cause hangs)
    config.resolve.cacheWithContext = false; // Disable context caching (can cause hangs)
    
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
