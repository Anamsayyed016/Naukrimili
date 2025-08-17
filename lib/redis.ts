/**
 * Redis Service - Persistent Caching for Performance
 * Provides Redis caching layer for database query results
 */

import { Redis } from 'ioredis';

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  // Connection pooling
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  // Performance optimizations
  enableOfflineQueue: false,
  enableReadyCheck: true,
  maxLoadingTimeout: 10000,
};

// Redis client instance
let redis: Redis | null = null;

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis {
  if (!redis) {
    try {
      redis = new Redis(redisConfig);
      
      redis.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });
      
      redis.on('error', (error) => {
        console.error('❌ Redis connection error:', error);
        redis = null;
      });
      
      redis.on('close', () => {
        console.log('🔌 Redis connection closed');
        redis = null;
      });
      
    } catch (error) {
      console.error('❌ Failed to create Redis client:', error);
      redis = null;
    }
  }
  
  return redis!;
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Cache service with Redis fallback to memory
 */
export class CacheService {
  private static instance: CacheService;
  private memoryCache = new Map<string, { data: any; expires: number }>();
  private redisAvailable: boolean = false;
  
  private constructor() {
    this.checkRedisAvailability();
  }
  
  static getInstance(): CacheService {
    if (!this.instance) {
      this.instance = new CacheService();
    }
    return this.instance;
  }
  
  /**
   * Check Redis availability
   */
  private async checkRedisAvailability() {
    this.redisAvailable = await isRedisAvailable();
  }
  
  /**
   * Set cache value
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      if (this.redisAvailable) {
        const client = getRedisClient();
        await client.setex(key, ttlSeconds, JSON.stringify(value));
      } else {
        // Fallback to memory cache
        this.memoryCache.set(key, {
          data: value,
          expires: Date.now() + (ttlSeconds * 1000)
        });
      }
    } catch (error) {
      console.warn('⚠️ Cache set failed, falling back to memory:', error);
      this.memoryCache.set(key, {
        data: value,
        expires: Date.now() + (ttlSeconds * 1000)
      });
    }
  }
  
  /**
   * Get cache value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redisAvailable) {
        const client = getRedisClient();
        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        // Fallback to memory cache
        const item = this.memoryCache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expires) {
          this.memoryCache.delete(key);
          return null;
        }
        
        return item.data;
      }
    } catch (error) {
      console.warn('⚠️ Cache get failed, falling back to memory:', error);
      // Fallback to memory cache
      const item = this.memoryCache.get(key);
      if (!item) return null;
      
      if (Date.now() > item.expires) {
        this.memoryCache.delete(key);
        return null;
      }
      
      return item.data;
    }
  }
  
  /**
   * Delete cache key
   */
  async delete(key: string): Promise<void> {
    try {
      if (this.redisAvailable) {
        const client = getRedisClient();
        await client.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      console.warn('⚠️ Cache delete failed, falling back to memory:', error);
      this.memoryCache.delete(key);
    }
  }
  
  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (this.redisAvailable) {
        const client = getRedisClient();
        await client.flushdb();
      } else {
        this.memoryCache.clear();
      }
    } catch (error) {
      console.warn('⚠️ Cache clear failed, falling back to memory:', error);
      this.memoryCache.clear();
    }
  }
  
  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    type: 'redis' | 'memory';
    size: number;
    keys: string[];
    memoryUsage?: any;
  }> {
    try {
      if (this.redisAvailable) {
        const client = getRedisClient();
        const keys = await client.keys('*');
        return {
          type: 'redis',
          size: keys.length,
          keys: keys.slice(0, 100), // Limit to first 100 keys
        };
      } else {
        return {
          type: 'memory',
          size: this.memoryCache.size,
          keys: Array.from(this.memoryCache.keys()).slice(0, 100),
          memoryUsage: (globalThis as any).process?.memoryUsage?.(),
        };
      }
    } catch (error) {
      console.warn('⚠️ Cache stats failed:', error);
      return {
        type: 'memory',
        size: this.memoryCache.size,
        keys: Array.from(this.memoryCache.keys()).slice(0, 100),
      };
    }
  }
  
  /**
   * Cache with tags for bulk invalidation
   */
  async setWithTags(key: string, value: any, tags: string[], ttlSeconds: number = 300): Promise<void> {
    await this.set(key, value, ttlSeconds);
    
    // Store tags for bulk invalidation
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const taggedKeys = await this.get<string[]>(tagKey) || [];
      if (!taggedKeys.includes(key)) {
        taggedKeys.push(key);
        await this.set(tagKey, taggedKeys, ttlSeconds);
      }
    }
  }
  
  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const taggedKeys = await this.get<string[]>(tagKey) || [];
      
      for (const key of taggedKeys) {
        await this.delete(key);
      }
      
      await this.delete(tagKey);
    }
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();

// Export Redis client for direct access
export { getRedisClient, isRedisAvailable };
