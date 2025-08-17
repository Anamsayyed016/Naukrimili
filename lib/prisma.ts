import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enhanced Prisma client with connection pooling and performance monitoring
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Add connection pooling for production
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Performance monitoring
  ...(process.env.NODE_ENV === 'production' && {
    // Production optimizations
    errorFormat: 'minimal' as const,
  }),
});

// Add performance monitoring middleware
if (process.env.NODE_ENV === 'production') {
  prisma.$use(async (params, next) => {
    const start = Date.now();
    
    try {
      const result = await next(params);
      const duration = Date.now() - start;
      
      // Log slow queries (>100ms)
      if (duration > 100) {
        console.warn(`🐌 Slow query detected: ${params.model}.${params.action} took ${duration}ms`);
      }
      
      // Log very slow queries (>500ms)
      if (duration > 500) {
        console.error(`🚨 Very slow query: ${params.model}.${params.action} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`❌ Query failed: ${params.model}.${params.action} failed after ${duration}ms:`, error);
      throw error;
    }
  });
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
