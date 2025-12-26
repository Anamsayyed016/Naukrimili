/**
 * Prisma Configuration File
 * 
 * Prisma 7+ supports prisma.config.ts for advanced configuration.
 * Note: For migrations, Prisma still requires the URL in schema.prisma.
 * This config file can be used for other Prisma CLI features.
 */

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});

