// In-memory cache with TTL support
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(cleanupIntervalMs: number = 60000) {
    // Cleanup expired items every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  set<T>(key: string, data: T, ttlMs: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`Cache cleanup: removed ${expiredKeys.length} expired items`);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Global cache instance
const globalCache = new MemoryCache();

// Cache utilities
export const cache = {
  // Basic cache operations
  set: <T>(key: string, data: T, ttlMs?: number) => globalCache.set(key, data, ttlMs),
  get: <T>(key: string) => globalCache.get<T>(key),
  has: (key: string) => globalCache.has(key),
  delete: (key: string) => globalCache.delete(key),
  clear: () => globalCache.clear(),
  size: () => globalCache.size(),
  keys: () => globalCache.keys(),

  // Memoization wrapper
  memoize: <T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    ttlMs?: number
  ) => {
    return ((...args: Parameters<T>): ReturnType<T> => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      const cacheKey = `memoize:${fn.name}:${key}`;
      
      const cached = globalCache.get<ReturnType<T>>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const result = fn(...args);
      globalCache.set(cacheKey, result, ttlMs);
      return result;
    }) as T;
  },

  // Async memoization wrapper
  memoizeAsync: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    ttlMs?: number
  ) => {
    const pendingPromises = new Map<string, Promise<any>>();

    return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      const cacheKey = `memoizeAsync:${fn.name}:${key}`;
      
      // Check cache first
      const cached = globalCache.get<Awaited<ReturnType<T>>>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Check if there's already a pending promise for this key
      if (pendingPromises.has(cacheKey)) {
        return pendingPromises.get(cacheKey)!;
      }

      // Create and cache the promise
      const promise = fn(...args).then(result => {
        globalCache.set(cacheKey, result, ttlMs);
        pendingPromises.delete(cacheKey);
        return result;
      }).catch(error => {
        pendingPromises.delete(cacheKey);
        throw error;
      });

      pendingPromises.set(cacheKey, promise);
      return promise;
    }) as T;
  },

  // Cache with tags for bulk invalidation
  setWithTags: <T>(key: string, data: T, tags: string[], ttlMs?: number) => {
    globalCache.set(key, data, ttlMs);
    
    // Store tag mappings
    tags.forEach(tag => {
      const tagKey = `tag:${tag}`;
      const taggedKeys = globalCache.get<string[]>(tagKey) || [];
      if (!taggedKeys.includes(key)) {
        taggedKeys.push(key);
        globalCache.set(tagKey, taggedKeys, ttlMs);
      }
    });
  },

  // Invalidate by tags
  invalidateByTags: (tags: string[]) => {
    tags.forEach(tag => {
      const tagKey = `tag:${tag}`;
      const taggedKeys = globalCache.get<string[]>(tagKey) || [];
      
      taggedKeys.forEach(key => globalCache.delete(key));
      globalCache.delete(tagKey);
    });
  },

  // Cache statistics
  stats: () => ({
    size: globalCache.size(),
    keys: globalCache.keys(),
    memoryUsage: process.memoryUsage ? process.memoryUsage() : null,
  }),
};

// Cache key generators
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  job: (jobId: string) => `job:${jobId}`,
  jobs: (filters: Record<string, any>) => `jobs:${JSON.stringify(filters)}`,
  resume: (resumeId: string) => `resume:${resumeId}`,
  userResumes: (userId: string) => `user:${userId}:resumes`,
  jobApplications: (jobId: string) => `job:${jobId}:applications`,
  userApplications: (userId: string) => `user:${userId}:applications`,
  search: (query: string, filters: Record<string, any>) => 
    `search:${query}:${JSON.stringify(filters)}`,
  analytics: (type: string, period: string) => `analytics:${type}:${period}`,
};

// Cache TTL constants (in milliseconds)
export const cacheTTL = {
  short: 5 * 60 * 1000,      // 5 minutes
  medium: 30 * 60 * 1000,    // 30 minutes
  long: 2 * 60 * 60 * 1000,  // 2 hours
  day: 24 * 60 * 60 * 1000,  // 24 hours
};

// React hook for cached data
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = cacheTTL.medium
) {
  // Removed React hooks to fix build errors

  // Hook implementation removed for build compatibility
  return null;
}

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    globalCache.destroy();
  });

  process.on('SIGINT', () => {
    globalCache.destroy();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    globalCache.destroy();
    process.exit(0);
  });
}

export default cache;