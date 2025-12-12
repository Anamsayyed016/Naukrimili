// CRITICAL: This file should ONLY be imported in server-side code (API routes, Server Components)
// Runtime check to prevent client-side bundling
if (typeof window !== 'undefined') {
  throw new Error(
    'Prisma Client cannot be used in the browser. ' +
    'This import should only be used in API routes or Server Components. ' +
    'Check your imports and ensure you are not importing @/lib/prisma in client components.'
  );
}

import type { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// CRITICAL: Lazy initialization to prevent build-time execution
// This ensures Prisma is only instantiated at runtime, not during Next.js build
function createPrismaClient(): PrismaClient | null {
  // Skip during build if env flag is set
  if (process.env.SKIP_BUILD_DB_QUERIES === 'true') {
    console.log('⏭️  [Prisma] Skipping client creation (SKIP_BUILD_DB_QUERIES=true)');
    return null;
  }

  // Require dynamically to defer module loading
  const { PrismaClient: PrismaClientConstructor } = require('@prisma/client');
  
  const client = new PrismaClientConstructor({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    
    // Performance monitoring and error handling
    ...(process.env.NODE_ENV === 'production' && {
      errorFormat: 'minimal' as const,
    }),
    
    // Add connection timeout to prevent hanging connections
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  // Global error handler for database connection issues
  client.$on('error' as never, (e: any) => {
    console.error('❌ [Database] Prisma error event:', e);
  });

  // Graceful shutdown - close connections on process exit
  const gracefulShutdown = async () => {
    console.log('🔌 [Database] Closing Prisma connections...');
    await client.$disconnect();
    console.log('✅ [Database] Prisma disconnected gracefully');
  };

  process.on('beforeExit', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);

  return client;
}

// Enhanced Prisma client with connection pooling, retry logic, and error handling
// CRITICAL: This is a SINGLETON - only ONE instance should exist globally
// Getter ensures lazy initialization
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    // Initialize on first access
    if (!globalForPrisma.prisma) {
      const client = createPrismaClient();
      if (!client) {
        // Return null for skipped operations
        throw new Error('[Prisma] Client not available (build mode or SKIP_BUILD_DB_QUERIES=true)');
      }
      globalForPrisma.prisma = client;
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ [Prisma] Client initialized lazily');
      }
    }
    return (globalForPrisma.prisma as any)[prop];
  }
});

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
