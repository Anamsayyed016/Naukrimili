/**
 * Redis Service - Persistent Caching for Performance
 * Provides Redis caching layer for database query results
 */

import { Redis } from 'ioredis';

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000
};

// Global Redis client instance
let redisClient: Redis | null = null;

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(redisConfig);
    
    redisClient.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
    
    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });
    
    redisClient.on('ready', () => {
      console.log('Redis ready for commands');
    });
  }
  
  return redisClient;
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis availability check failed:', error);
    return false;
  }
}

/**
 * Close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Redis utility functions
 */
export const redisUtils = {
  // Set key with expiration
  async set(key: string, value: string, expireSeconds?: number): Promise<void> {
    const client = getRedisClient();
    if (expireSeconds) {
      await client.setex(key, expireSeconds, value);
    } else {
      await client.set(key, value);
    }
  },

  // Get value by key
  async get(key: string): Promise<string | null> {
    const client = getRedisClient();
    return await client.get(key);
  },

  // Delete key
  async del(key: string): Promise<number> {
    const client = getRedisClient();
    return await client.del(key);
  },

  // Check if key exists
  async exists(key: string): Promise<number> {
    const client = getRedisClient();
    return await client.exists(key);
  },

  // Set expiration for existing key
  async expire(key: string, seconds: number): Promise<number> {
    const client = getRedisClient();
    return await client.expire(key, seconds);
  },

  // Get time to live for key
  async ttl(key: string): Promise<number> {
    const client = getRedisClient();
    return await client.ttl(key);
  },

  // Increment counter
  async incr(key: string): Promise<number> {
    const client = getRedisClient();
    return await client.incr(key);
  },

  // Decrement counter
  async decr(key: string): Promise<number> {
    const client = getRedisClient();
    return await client.decr(key);
  },

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<number> {
    const client = getRedisClient();
    return await client.hset(key, field, value);
  },

  async hget(key: string, field: string): Promise<string | null> {
    const client = getRedisClient();
    return await client.hget(key, field);
  },

  async hgetall(key: string): Promise<Record<string, string>> {
    const client = getRedisClient();
    return await client.hgetall(key);
  },

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    const client = getRedisClient();
    return await client.lpush(key, ...values);
  },

  async rpush(key: string, ...values: string[]): Promise<number> {
    const client = getRedisClient();
    return await client.rpush(key, ...values);
  },

  async lpop(key: string): Promise<string | null> {
    const client = getRedisClient();
    return await client.lpop(key);
  },

  async rpop(key: string): Promise<string | null> {
    const client = getRedisClient();
    return await client.rpop(key);
  },

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const client = getRedisClient();
    return await client.lrange(key, start, stop);
  },

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    const client = getRedisClient();
    return await client.sadd(key, members);
  },

  async srem(key: string, ...members: string[]): Promise<number> {
    const client = getRedisClient();
    return await client.srem(key, members);
  },

  async smembers(key: string): Promise<string[]> {
    const client = getRedisClient();
    return await client.smembers(key);
  },

  async sismember(key: string, member: string): Promise<number> {
    const client = getRedisClient();
    return await client.sismember(key, member);
  },

  // Sorted set operations
  async zadd(key: string, score: number, member: string): Promise<number> {
    const client = getRedisClient();
    return await client.zadd(key, score, member);
  },

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    const client = getRedisClient();
    return await client.zrange(key, start, stop);
  },

  async zscore(key: string, member: string): Promise<string | null> {
    const client = getRedisClient();
    return await client.zscore(key, member);
  },

  // Pattern matching
  async keys(pattern: string): Promise<string[]> {
    const client = getRedisClient();
    return await client.keys(pattern);
  },

  // Flush database (use with caution!)
  async flushdb(): Promise<string> {
    const client = getRedisClient();
    return await client.flushdb();
  },

  // Get database size
  async dbsize(): Promise<number> {
    const client = getRedisClient();
    return await client.dbsize();
  },

  // Set with tags for bulk invalidation
  async setWithTags(key: string, value: any, tags: string[], ttlSeconds: number = 300): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
    
    // Store tags for bulk invalidation
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const taggedKeys = await this.get(tagKey);
      const keys = taggedKeys ? JSON.parse(taggedKeys) : [];
      if (!keys.includes(key)) {
        keys.push(key);
        await this.set(tagKey, JSON.stringify(keys), ttlSeconds);
      }
    }
  },

  // Invalidate cache by tags
  async invalidateByTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const taggedKeys = await this.get(tagKey);
      if (taggedKeys) {
        const keys = JSON.parse(taggedKeys);
        for (const key of keys) {
          await this.del(key);
        }
        await this.del(tagKey);
      }
    }
  },

  // Get cache statistics
  async getStats(): Promise<{
    type: 'redis' | 'memory';
    size: number;
    keys: string[];
  }> {
    try {
      const client = getRedisClient();
      const keys = await client.keys('*');
      return {
        type: 'redis',
        size: keys.length,
        keys: keys.slice(0, 100), // Limit to first 100 keys
      };
    } catch (error) {
      console.warn('Cache stats failed:', error);
      return {
        type: 'memory',
        size: 0,
        keys: [],
      };
    }
  }
};
