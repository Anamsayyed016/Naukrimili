/**
 * Prisma Configuration File
 * 
 * In Prisma 7+, the datasource URL is configured here instead of in schema.prisma
 * This file is used by Prisma CLI commands like `prisma migrate deploy`
 */

import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
});

