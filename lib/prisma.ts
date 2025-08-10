// Real Prisma client singleton (MongoDB) – replaces previous mock implementation.
// Ensure env var DATABASE_URL is set (schema.prisma expects "DATABASE_URL").
import { PrismaClient } from '@prisma/client';

// In dev, reuse the client across HMR to avoid exhausting connections.
// In prod (Hostinger), a new instance per process is fine.
declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/naming-convention
  var _prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient = global._prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') global._prisma = prisma;

// Optional lightweight connectivity check (can be invoked at startup if desired)
export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    // For MongoDB provider, a trivial query is findMany on a small collection.
    await prisma.user.findMany({ take: 1 });
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Database connection verification failed:', e);
    return false;
  }
}
