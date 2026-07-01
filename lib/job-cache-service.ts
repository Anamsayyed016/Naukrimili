/**
 * Job Cache Service - Redis/Memory Caching for Performance
 * Implements Step 7: Caching & Performance optimization
 */

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  prefix: string;
}

export class JobCacheService {
  private static instance: JobCacheService;
  private cache: Map<string, { data: any; expires: number }> = new Map();
  
  // Cache configurations for different data types
  private readonly configs = {
    country_jobs: { ttl: 1800, prefix: 'country_jobs' }, // 30 minutes
    local_jobs: { ttl: 300, prefix: 'local_jobs' },     // 5 minutes (more frequent updates)
    job_stats: { ttl: 3600, prefix: 'job_stats' },      // 1 hour
    user_location: { ttl: 86400, prefix: 'user_loc' },  // 24 hours
    api_jobs_list: { ttl: 60, prefix: 'api_jobs_list' }, // 1 minute — hot listing path
    api_companies: { ttl: 120, prefix: 'api_companies' }, // 2 minutes
    /** Jobs keyed by listing id / sourceId so detail page can resolve listing→click */
    job_detail: { ttl: 1800, prefix: 'job_detail' }, // 30 minutes
  };

  /** Cache a listing row under every id shape the detail route may receive. */
  async cacheJobForDetail(job: Record<string, unknown>): Promise<void> {
    const fullDescription =
      typeof job.descriptionFull === 'string' && job.descriptionFull.trim()
        ? job.descriptionFull
        : typeof job.description === 'string'
          ? job.description
          : '';
    const { descriptionFull: _omit, ...rest } = job;
    const jobForDetail: Record<string, unknown> = { ...rest, description: fullDescription };

    const keys = new Set<string>();
    const id = jobForDetail.id != null ? String(jobForDetail.id) : '';
    const sourceId = jobForDetail.sourceId != null ? String(jobForDetail.sourceId) : '';
    if (id) keys.add(id);
    if (sourceId) keys.add(sourceId);
    const ext = id.match(/^ext-(?:external-)?(\w+)-(.+)$/i);
    if (ext) {
      keys.add(ext[2]);
      keys.add(`${ext[1]}-${ext[2]}`);
    }
    const prefixed = sourceId.match(/^(adzuna|jooble|serpapi|usajobs|jsearch)-(.+)$/i);
    if (prefixed) keys.add(prefixed[2]);
    for (const key of keys) {
      if (key) await this.set(key, jobForDetail, 'job_detail');
    }
  }

  async cacheJobsForDetail(jobs: Record<string, unknown>[]): Promise<void> {
    for (const job of jobs) {
      await this.cacheJobForDetail(job);
    }
  }

  static getInstance(): JobCacheService {
    if (!this.instance) {
      this.instance = new JobCacheService();
    }
    return this.instance;
  }

  /**
   * Get cached data
   */
  async get<T>(key: string, type: keyof typeof this.configs): Promise<T | null> {
    const fullKey = `${this.configs[type].prefix}:${key}`;
    const cached = this.cache.get(fullKey);
    
    if (!cached) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > cached.expires) {
      this.cache.delete(fullKey);
      return null;
    }
    
    return cached.data as T;
  }

  /**
   * Set cached data
   */
  async set<T>(key: string, data: T, type: keyof typeof this.configs): Promise<void> {
    const config = this.configs[type];
    const fullKey = `${config.prefix}:${key}`;
    const expires = Date.now() + (config.ttl * 1000);
    
    this.cache.set(fullKey, { data, expires });
    
    // Cleanup expired entries periodically
    if (Math.random() < 0.1) { // 10% chance
      this.cleanup();
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string, type: keyof typeof this.configs): Promise<void> {
    const fullKey = `${this.configs[type].prefix}:${key}`;
    this.cache.delete(fullKey);
  }

  /**
   * Generate cache key for job search
   */
  generateJobSearchKey(filters: any, pagination: any): string {
    const keyParts = [
      filters.countries?.join(',') || filters.country || 'all',
      filters.location || 'global',
      filters.q || 'any',
      filters.jobType || 'all',
      filters.experienceLevel || 'all',
      filters.salaryMin || '0',
      filters.salaryMax || 'max',
      pagination.page || '1',
      pagination.limit || '20',
      filters.sortBy || 'relevance',
    ];
    
    return keyParts.join('|');
  }

  /**
   * Generate cache key for user location
   */
  generateLocationKey(ip: string): string {
    return `ip_${ip.replace(/[.:]/g, '_')}`;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, value] of entries) {
      if (now > value.expires) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Drop cached public job listing responses so new employer posts appear immediately.
   */
  async invalidateJobsListingCache(): Promise<void> {
    const prefixes = [
      `${this.configs.api_jobs_list.prefix}:`,
      `${this.configs.country_jobs.prefix}:`,
      `${this.configs.local_jobs.prefix}:`,
    ];
    let removed = 0;
    for (const key of Array.from(this.cache.keys())) {
      if (prefixes.some((prefix) => key.startsWith(prefix))) {
        this.cache.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      console.log(`🗑️ Invalidated ${removed} job listing cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; types: Record<string, number> } {
    const types: Record<string, number> = {};
    const keys = Array.from(this.cache.keys());
    
    for (const key of keys) {
      const prefix = key.split(':')[0];
      types[prefix] = (types[prefix] || 0) + 1;
    }
    
    return {
      size: this.cache.size,
      types,
    };
  }
}

// Export singleton instance
export const jobCacheService = JobCacheService.getInstance();

/**
 * Cache-aware enhanced job search service wrapper
 */
export class CachedJobSearchService {
  
  /**
   * Search jobs with caching
   */
  static async searchJobsWithCache(
    searchParams: any,
    userLocation: any,
    request: Request,
    searchFunction: Function
  ): Promise<any> {
    // Generate cache key
    const cacheKey = jobCacheService.generateJobSearchKey(
      searchParams.filters || {}, 
      { page: Math.floor((searchParams.offset || 0) / (searchParams.limit || 20)) + 1, limit: searchParams.limit }
    );
    
    // Determine cache type based on search scope
    const isLocalSearch = userLocation?.city && searchParams.location;
    const cacheType = isLocalSearch ? 'local_jobs' : 'country_jobs';
    
    // Try to get from cache first
    const cached = await jobCacheService.get(cacheKey, cacheType);
    if (cached) {
          return {
      ...(cached as any),
      from_cache: true,
      cache_type: cacheType,
    };
    }
    
    // Execute search
    const result = await searchFunction();
    
    // Cache the result
    await jobCacheService.set(cacheKey, result, cacheType);
    
    return {
      ...(result as any),
      from_cache: false,
      cache_type: cacheType,
    };
  }

  /**
   * Get user location with caching
   */
  static async getUserLocationWithCache(request: Request, getLocationFunction: Function): Promise<any> {
    // Extract IP for cache key
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0].trim() || realIP || '127.0.0.1';
    
    const cacheKey = jobCacheService.generateLocationKey(ip);
    
    // Try cache first
    const cached = await jobCacheService.get(cacheKey, 'user_location');
    if (cached) {
      return cached;
    }
    
    // Get fresh location
    const location = await getLocationFunction();
    
    // Cache if successful
    if (location) {
      await jobCacheService.set(cacheKey, location, 'user_location');
    }
    
    return location;
  }
}
