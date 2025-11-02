import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enhanced Prisma client with connection pooling, retry logic, and error handling
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  
  // Performance monitoring and error handling
  ...(process.env.NODE_ENV === 'production' && {
    errorFormat: 'minimal' as const,
  }),
});

// Connection pool settings (configured in DATABASE_URL)
// Example: postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20

// Global error handler for database connection issues
prisma.$on('error' as never, (e: any) => {
  console.error('❌ [Database] Prisma error event:', e);
});

// Graceful shutdown - close connections on process exit
const gracefulShutdown = async () => {
  console.log('🔌 [Database] Closing Prisma connections...');
  await prisma.$disconnect();
  console.log('✅ [Database] Prisma disconnected gracefully');
};

process.on('beforeExit', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Database health check with retry logic
 * Returns true if database is accessible, false otherwise
 */
export async function checkDatabaseHealth(retries = 3, delay = 2000): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ [Database] Health check passed');
      return true;
    } catch (error) {
      console.error(`❌ [Database] Health check failed (attempt ${i + 1}/${retries}):`, 
        error instanceof Error ? error.message : 'Unknown error');
      
      if (i < retries - 1) {
        console.log(`⏳ [Database] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
}

/**
 * Execute database query with automatic retry on connection failure
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      const isConnectionError = 
        error.code === 'P1001' || // Can't reach database server
        error.code === 'P1002' || // Database timeout
        error.code === 'P1008' || // Operations timeout
        error.code === 'P1017' || // Server closed connection
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ETIMEDOUT') ||
        error.message?.includes('Connection terminated');
      
      if (isConnectionError && i < retries - 1) {
        console.warn(`⚠️ [Database] Connection error (attempt ${i + 1}/${retries}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      console.error('❌ [Database] Operation failed:', error.message);
      throw error;
    }
  }
  return null;
}

export default prisma;
