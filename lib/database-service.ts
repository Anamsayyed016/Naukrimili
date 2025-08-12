/**
 * Database Service Layer
 * Centralized database operations with connection pooling, error handling, and performance optimization
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';

// Enhanced Prisma client with connection pooling
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['error', 'warn', 'info'] 
    : ['error'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Connection pool configuration
const CONNECTION_POOL_CONFIG = {
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
  queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
};

// Database health check
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  latency: number;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1 as health_check`;
    return {
      isHealthy: true,
      latency: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      isHealthy: false,
      latency: Date.now() - startTime,
      error: error.message,
    };
  }
}

// Enhanced error handling for database operations
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function handleDatabaseError(error: any): DatabaseError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new DatabaseError('Unique constraint violation', 'DUPLICATE_ENTRY', error);
      case 'P2025':
        return new DatabaseError('Record not found', 'NOT_FOUND', error);
      case 'P2003':
        return new DatabaseError('Foreign key constraint violation', 'FOREIGN_KEY_ERROR', error);
      case 'P2034':
        return new DatabaseError('Transaction failed due to dependency conflict', 'TRANSACTION_CONFLICT', error);
      default:
        return new DatabaseError(`Database error: ${error.message}`, 'PRISMA_ERROR', error);
    }
  }
  
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return new DatabaseError('Unknown database error', 'UNKNOWN_ERROR', error);
  }
  
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new DatabaseError('Database connection failed', 'CONNECTION_ERROR', error);
  }
  
  return new DatabaseError('Unexpected database error', 'UNEXPECTED_ERROR', error);
}

// Pagination helper
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function createPaginationQuery(params: PaginationParams) {
  const skip = (params.page - 1) * params.limit;
  return {
    skip,
    take: params.limit,
    orderBy: params.sortBy ? {
      [params.sortBy]: params.sortOrder || 'desc'
    } : { createdAt: 'desc' as const }
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

// Request parameter extraction helper
export function extractPaginationFromRequest(request: NextRequest): PaginationParams {
  const { searchParams } = new URL(request.url);
  
  return {
    page: Math.max(1, parseInt(searchParams.get('page') || '1')),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20'))),
    sortBy: searchParams.get('sort_by') || undefined,
    sortOrder: (searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
  };
}

// User authentication helper
export function extractUserFromRequest(request: NextRequest): { userId: number } | null {
  // This would typically extract from JWT token or session
  // For now, we'll use a header-based approach for development
  const userId = request.headers.get('x-user-id');
  if (!userId || isNaN(parseInt(userId))) {
    return null;
  }
  return { userId: parseInt(userId) };
}

// Database retry logic
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  
  throw lastError;
}

// Connection cleanup
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

// Export databaseService object for backward compatibility
export const databaseService = {
  getClient: () => prisma,
  checkHealth: checkDatabaseHealth,
  disconnect: disconnectDatabase,
  withRetry,
  handleError: handleDatabaseError,
};
