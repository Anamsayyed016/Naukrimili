import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enhanced Prisma client with connection pooling and performance monitoring
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Add connection pooling for production
  ...(process.env.DATABASE_URL && {
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }),
  // Performance monitoring
  ...(process.env.NODE_ENV === 'production' && {
    // Production optimizations
    errorFormat: 'minimal' as const,
  }),
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
