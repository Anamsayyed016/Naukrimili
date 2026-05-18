#!/usr/bin/env node
/**
 * Copy .env into .next/standalone so the standalone server can read DATABASE_URL
 * when PM2 cwd differs. Does not embed secrets in source — reads project .env only.
 */

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const envSource = path.join(root, '.env');
const standaloneDir = path.join(root, '.next', 'standalone');
const envTarget = path.join(standaloneDir, '.env');

function syncEnvToStandalone() {
  if (!fs.existsSync(standaloneDir)) {
    console.log('⏭️  No .next/standalone — skip env sync (run after next build with output: standalone)');
    return false;
  }

  if (!fs.existsSync(envSource)) {
    console.warn('⚠️  .env not found at project root; standalone will rely on PM2 env_file');
    return false;
  }

  fs.copyFileSync(envSource, envTarget);
  console.log('✅ Copied .env → .next/standalone/.env');

  const prismaDir = path.join(standaloneDir, 'prisma');
  const prismaSource = path.join(root, 'prisma');
  if (fs.existsSync(prismaSource) && !fs.existsSync(prismaDir)) {
    fs.cpSync(prismaSource, prismaDir, { recursive: true });
    console.log('✅ Copied prisma/ → .next/standalone/prisma/');
  }
  return true;
}

module.exports = { syncEnvToStandalone };

if (require.main === module) {
  syncEnvToStandalone();
}
