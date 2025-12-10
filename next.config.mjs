import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

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
      'node_modules/@prisma/client*',
      'node_modules/.prisma/client*',
    ],
  },
  
  // CRITICAL: Disable static page generation for problematic routes during build
  // This prevents Next.js from trying to statically generate pages that use Prisma
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  
  // CRITICAL: Add empty turbopack config to silence error when NOT using --webpack flag
  // When --webpack flag is used, this is ignored. When not used, Turbopack needs this to avoid errors.
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
  // Ultra-minimal webpack config - absolute minimum to prevent hangs
  // Only handles critical node: imports, nothing else
  webpack: (config, { isServer, webpack }) => {
    // CRITICAL: Skip webpack config entirely if it's causing hangs
    // Only apply minimal necessary changes
    
    // Minimal resolve setup - only if needed
    if (!config.resolve) config.resolve = {};
    if (!config.resolve.alias) config.resolve.alias = {};
    
    // Set @ alias only if missing
    if (!config.resolve.alias['@']) {
      config.resolve.alias['@'] = path.resolve(process.cwd());
    }
    
    // CRITICAL: Fix Tailwind CSS v4 import resolution
    // Tailwind v4 uses @import "tailwindcss" which webpack's CSS loader tries to resolve incorrectly
    // Use a simple path-based alias to avoid synchronous require.resolve which can cause hangs
    if (!config.resolve.alias['tailwindcss']) {
      // Use path-based resolution instead of require.resolve to prevent hangs
      const tailwindcssPath = path.resolve(process.cwd(), 'node_modules/tailwindcss');
      config.resolve.alias['tailwindcss'] = tailwindcssPath;
    }
    
    // CRITICAL: Only alias essential node: imports (minimal set)
    const essentialNodeAliases = {
      'node:fs': 'fs',
      'node:path': 'path',
      'node:buffer': 'buffer',
      'node:util': 'util',
      'node:crypto': 'crypto',
    };
    
    Object.keys(essentialNodeAliases).forEach(key => {
      if (!config.resolve.alias[key]) {
        config.resolve.alias[key] = essentialNodeAliases[key];
      }
    });
    
    // Server-side: Only externalize puppeteer if needed
    if (isServer) {
      if (!config.externals) config.externals = [];
      if (typeof config.externals === 'object' && !Array.isArray(config.externals)) {
        config.externals = [config.externals];
      }
      const hasPuppeteer = Array.isArray(config.externals) 
        ? config.externals.some(ext => typeof ext === 'object' && ext?.puppeteer)
        : false;
      if (!hasPuppeteer) {
        config.externals.push({
          'puppeteer': 'commonjs puppeteer',
          'puppeteer-core': 'commonjs puppeteer-core',
        });
      }
    }
    
    // Client-side: Minimal fallbacks (only critical ones)
    if (!isServer) {
      if (!config.resolve.fallback) config.resolve.fallback = {};
      const criticalFallbacks = ['fs', 'net', 'tls', 'crypto', 'path'];
      criticalFallbacks.forEach(module => {
        if (config.resolve.fallback[module] === undefined) {
          config.resolve.fallback[module] = false;
        }
      });
      
      // CRITICAL: Prevent Prisma and server-only modules on client
      const serverOnlyAliases = {
        '@prisma/client': false,
        '.prisma/client': false,
        'prisma': false,
        '@/lib/prisma': false,
        '@/lib/auth-utils': false,
        '@/lib/nextauth-config': false,
      };
      Object.keys(serverOnlyAliases).forEach(key => {
        if (config.resolve.alias[key] === undefined) {
          config.resolve.alias[key] = serverOnlyAliases[key];
        }
      });
      
      // CRITICAL: Add IgnorePlugin to completely exclude problematic modules from client bundle
      if (!config.plugins) config.plugins = [];
      // Check if plugins already exist to avoid duplicates
      const hasPrismaIgnore = config.plugins.some(
        plugin => plugin && plugin.constructor && plugin.constructor.name === 'IgnorePlugin'
      );
      if (!hasPrismaIgnore) {
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^@prisma\/client$/,
          }),
          new webpack.IgnorePlugin({
            resourceRegExp: /^\.prisma\/client$/,
          }),
          new webpack.IgnorePlugin({
            resourceRegExp: /^@\/lib\/prisma$/,
          })
        );
      }
    }
    
    // CRITICAL: Optimize module resolution to prevent deep analysis
    if (!config.optimization) config.optimization = {};
    if (!config.optimization.moduleIds) {
      config.optimization.moduleIds = 'deterministic';
    }
    
    // CRITICAL: Enable safe caching at ROOT level (not in resolve.cache - that's invalid!)
    // Webpack cache belongs at the root level, not under resolve
    if (!config.cache) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    
    // Disable performance hints
    if (!config.performance) config.performance = {};
    config.performance.hints = false;
    
    // CRITICAL: Limit module analysis depth to prevent hangs
    if (!config.resolve.symlinks) {
      config.resolve.symlinks = false;
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
