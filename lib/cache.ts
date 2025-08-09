// In-memory cache with TTL support and helpers
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(cleanupIntervalMs: number = 60_000) {
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  set<T>(key: string, data: T, ttlMs: number = 300_000): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
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
    const expired: string[] = [];
    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) expired.push(key);
    });
    expired.forEach((k) => this.cache.delete(k));
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Global cache instance
const globalCache = new MemoryCache();

// Cache utilities
export const cache = {
  // Basic operations
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
    ttlMs?: number,
  ) => {
    return ((...args: Parameters<T>): ReturnType<T> => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      const cacheKey = `memoize:${fn.name}:${key}`;
      const cached = globalCache.get<ReturnType<T>>(cacheKey);
      if (cached !== null) return cached as ReturnType<T>;
      const result = fn(...args);
      globalCache.set(cacheKey, result, ttlMs);
      return result;
    }) as T;
  },

  // Async memoization wrapper with pending promise de-dupe
  memoizeAsync: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    ttlMs?: number,
  ) => {
    const pending = new Map<string, Promise<any>>();
    return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      const cacheKey = `memoizeAsync:${fn.name}:${key}`;

      const cached = globalCache.get<Awaited<ReturnType<T>>>(cacheKey);
      if (cached !== null) return cached;

      if (pending.has(cacheKey)) return pending.get(cacheKey)!;

      const p = fn(...args)
        .then((result) => {
          globalCache.set(cacheKey, result, ttlMs);
          pending.delete(cacheKey);
          return result;
        })
        .catch((err) => {
          pending.delete(cacheKey);
          throw err;
        });

      pending.set(cacheKey, p);
      return p as any;
    }) as T;
  },

  // Cache with tags for bulk invalidation
  setWithTags: <T>(key: string, data: T, tags: string[], ttlMs?: number) => {
    globalCache.set(key, data, ttlMs);
    tags.forEach((tag) => {
      const tagKey = `tag:${tag}`;
      const taggedKeys = globalCache.get<string[]>(tagKey) || [];
      if (!taggedKeys.includes(key)) {
        taggedKeys.push(key);
        globalCache.set(tagKey, taggedKeys, ttlMs);
      }
    });
  },

  invalidateByTags: (tags: string[]) => {
    tags.forEach((tag) => {
      const tagKey = `tag:${tag}`;
      const taggedKeys = globalCache.get<string[]>(tagKey) || [];
      taggedKeys.forEach((k) => globalCache.delete(k));
      globalCache.delete(tagKey);
    });
  },

  // Stats
  stats: () => ({
    size: globalCache.size(),
    keys: globalCache.keys(),
    memoryUsage: (globalThis as any).process?.memoryUsage ? (globalThis as any).process.memoryUsage() : null,
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
  search: (query: string, filters: Record<string, any>) => `search:${query}:${JSON.stringify(filters)}`,
  analytics: (type: string, period: string) => `analytics:${type}:${period}`,
};

export default cache;