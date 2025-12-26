/**
 * Prisma 7+ no longer allows datasource URLs inside schema files.
 * This config file is picked up automatically by the CLI/runtime.
 */

const config = {
  datasource: {
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL,
    },
  },
};

module.exports = config;