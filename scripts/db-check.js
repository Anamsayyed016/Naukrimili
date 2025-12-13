// Lightweight Prisma DB connectivity check using standalone bundle's client
// Uses Prisma client from .next/standalone to avoid needing root node_modules

const path = require('path');
const fs = require('fs');

function redacted(url) {
  if (!url) return 'MISSING';
  try {
    const u = new URL(url);
    const user = u.username ? '***' : '';
    const host = u.hostname;
    const db = u.pathname.replace(/^\//, '');
    return `${u.protocol}//${user}:***@${host}/${db}`;
  } catch {
    return 'INVALID_URL_FORMAT';
  }
}

async function main() {
  const envUrl = process.env.DATABASE_URL;
  console.log('DB_CHECK: DATABASE_URL =', redacted(envUrl));

  const prismaClientPath = path.join(process.cwd(), '.next', 'standalone', 'node_modules', '@prisma', 'client');
  const prismaEnginesPath = path.join(process.cwd(), '.next', 'standalone', 'node_modules', '@prisma');

  const hasClient = fs.existsSync(prismaClientPath);
  const hasEngines = fs.existsSync(prismaEnginesPath);
  console.log('DB_CHECK: Prisma client present:', hasClient);
  console.log('DB_CHECK: Prisma engines folder present:', hasEngines);

  if (!hasClient) {
    console.error('DB_CHECK ERROR: Prisma client not found in standalone bundle.');
    process.exitCode = 2;
    return;
  }

  let { PrismaClient } = require(prismaClientPath);
  const prisma = new PrismaClient();

  try {
    const version = await prisma.$queryRaw`SELECT version()`;
    console.log('DB_CHECK: Connected. Server version:', version);

    // Try a simple query on a known table to validate schema presence
    // Adjust to existing table names if needed
    try {
      const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 5`;
      console.log('DB_CHECK: Sample tables:', tables);
    } catch (innerErr) {
      console.warn('DB_CHECK WARN: Schema query failed:', innerErr?.message || innerErr);
    }
  } catch (err) {
    console.error('DB_CHECK FAIL: Cannot connect to DB:', err?.message || err);
    // Output known prisma engine paths for debugging
    try {
      const files = fs.readdirSync(prismaEnginesPath);
      console.log('DB_CHECK: Prisma engines contents sample:', files.slice(0, 5));
    } catch {}
    process.exitCode = 1;
  } finally {
    try { await prisma.$disconnect(); } catch {}
  }
}

main();
