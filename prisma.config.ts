/**
 * Prisma Configuration File
 * 
 * NOTE: Prisma 6.18.0 has limited support for prisma.config.ts.
 * This file is kept for future Prisma 7+ migration.
 * For Prisma 6, configuration is primarily done in schema.prisma.
 * 
 * IMPORTANT: If Prisma CLI errors occur with this file, it can be safely
 * removed or renamed to prisma.config.ts.bak since Prisma 6 doesn't require it.
 */

// Use explicit dotenv import instead of side-effect import 'dotenv/config'
// This works better in Prisma CLI's bundled Node environment where the
// side-effect import may not properly resolve the module
import dotenv from 'dotenv';
dotenv.config();

// Prisma 7+ config support
// For Prisma 6, this will be safely ignored if the module doesn't exist
// Using a type-safe approach that works in both Prisma 6 and 7+
let config: any = {};

// Safely check for Prisma 7+ config module at runtime
// Prisma 6 doesn't have this module, so we handle it gracefully
if (typeof require !== 'undefined') {
  try {
    // @ts-ignore - Prisma 6 doesn't have this module, TypeScript will error
    const prismaConfig = require('prisma/config');
    if (prismaConfig && prismaConfig.defineConfig && prismaConfig.env) {
      const { defineConfig, env } = prismaConfig;
      config = defineConfig({
        schema: 'prisma/schema.prisma',
        migrations: {
          path: 'prisma/migrations',
        },
        datasource: {
          url: env('DATABASE_URL'),
        },
      });
    }
  } catch (e) {
    // Prisma 6 doesn't support prisma/config module - this is expected
    // Export empty object so Prisma CLI doesn't error when loading this file
    config = {};
  }
}

export default config;
