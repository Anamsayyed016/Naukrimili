// Prisma client singleton for the minimal Postgres schema (Job model only right now).
// Ensure env var DATABASE_URL is set (schema.prisma expects "DATABASE_URL").
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var,@typescript-eslint/naming-convention
  var _prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient = global._prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') global._prisma = prisma;

// Connectivity / readiness check (uses a lightweight raw query to avoid model coupling)
export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Database connection verification failed:', e);
    return false;
  }
}
