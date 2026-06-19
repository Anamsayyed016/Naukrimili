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

function syncStaticToStandalone() {
  const staticSource = path.join(root, '.next', 'static');
  const standaloneNextDir = path.join(standaloneDir, '.next');
  const staticTarget = path.join(standaloneNextDir, 'static');

  if (!fs.existsSync(staticSource)) {
    console.warn('⚠️  .next/static not found — skip static sync');
    return false;
  }

  fs.mkdirSync(standaloneNextDir, { recursive: true });
  fs.rmSync(staticTarget, { recursive: true, force: true });
  fs.cpSync(staticSource, staticTarget, { recursive: true });

  const buildIdSource = path.join(root, '.next', 'BUILD_ID');
  const buildIdTarget = path.join(standaloneNextDir, 'BUILD_ID');
  if (fs.existsSync(buildIdSource)) {
    fs.copyFileSync(buildIdSource, buildIdTarget);
  }

  const fileCount = fs.readdirSync(staticTarget, { recursive: true }).length;
  console.log(`✅ Synced .next/static → .next/standalone/.next/static (${fileCount} entries)`);
  return true;
}

function syncPublicToStandalone() {
  const publicSource = path.join(root, 'public');
  const publicTarget = path.join(standaloneDir, 'public');

  if (!fs.existsSync(publicSource)) {
    return false;
  }

  fs.rmSync(publicTarget, { recursive: true, force: true });
  fs.cpSync(publicSource, publicTarget, { recursive: true });
  console.log('✅ Synced public/ → .next/standalone/public/');
  return true;
}

function syncEnvToStandalone() {
  if (!fs.existsSync(standaloneDir)) {
    console.log('⏭️  No .next/standalone — skip standalone sync (run after next build with output: standalone)');
    return false;
  }

  let synced = false;

  if (fs.existsSync(envSource)) {
    fs.copyFileSync(envSource, envTarget);
    console.log('✅ Copied .env → .next/standalone/.env');
    synced = true;
  } else {
    console.warn('⚠️  .env not found at project root; standalone will rely on PM2 env_file');
  }

  const prismaDir = path.join(standaloneDir, 'prisma');
  const prismaSource = path.join(root, 'prisma');
  if (fs.existsSync(prismaSource) && !fs.existsSync(prismaDir)) {
    fs.cpSync(prismaSource, prismaDir, { recursive: true });
    console.log('✅ Copied prisma/ → .next/standalone/prisma/');
    synced = true;
  }

  // Always refresh static assets so chunk hashes match the current build.
  if (syncStaticToStandalone()) {
    synced = true;
  }

  if (syncPublicToStandalone()) {
    synced = true;
  }

  return synced;
}

module.exports = { syncEnvToStandalone, syncStaticToStandalone, syncPublicToStandalone };

if (require.main === module) {
  syncEnvToStandalone();
}
