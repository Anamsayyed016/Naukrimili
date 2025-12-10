/**
 * Resume Autocomplete Service
 * Hybrid approach: Instant database search + AI enhancement
 * Provides Google-like real-time suggestions for resume builder
 */

import { prisma } from '@/lib/prisma';
import { HybridFormSuggestions } from '@/lib/hybrid-form-suggestions';

// In-memory cache for instant suggestions (fallback if Redis unavailable)
const memoryCache = new Map<string, { data: string[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface ResumeAutocompleteResult {
  suggestions: string[];
  source: 'database' | 'ai' | 'hybrid' | 'fallback';
  confidence: number;
  responseTime: number;
}

interface RedisUtils {
  get?: (key: string) => Promise<string | null>;
  set?: (key: string, value: string, ttl?: number) => Promise<void>;
}

export class ResumeAutocompleteService {
  private hybridAI: HybridFormSuggestions;
  private redis: RedisUtils | null = null;

  constructor() {
    this.hybridAI = new HybridFormSuggestions();
    // Try to import Redis if available
    this.initRedis();
  }

  private async initRedis() {
    try {
      const { redisUtils } = await import('@/lib/redis');
      this.redis = redisUtils;
    } catch {
      console.debug('Redis not available, using memory cache');
    }
  }

  /**
   * Get instant suggestions from database (0-50ms response time)
   */
  private async getInstantDBSuggestions(
    field: string,
    query: string,
    _context: Record<string, unknown>
  ): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const suggestions: string[] = [];

    try {
      switch (field) {
        case 'summary':
          // For summary, we can't do instant DB search effectively
          // Return empty to let AI handle it
          return [];

        case 'job_title':
        case 'title':
          // Search job titles from database
          const jobTitles = await prisma.job.findMany({
            where: {
              title: {
                contains: query,
                mode: 'insensitive',
              },
              isActive: true,
            },
            select: { title: true },
            distinct: ['title'],
            take: 8,
            orderBy: { views: 'desc' },
          });
          suggestions.push(...jobTitles.map((j) => j.title));
          break;

        case 'company':
          // Search companies from database
          const companies = await prisma.job.findMany({
            where: {
              company: {
                contains: query,
                mode: 'insensitive',
              },
              isActive: true,
            },
            select: { company: true },
            distinct: ['company'],
            take: 8,
            orderBy: { applicationsCount: 'desc' },
          });
          suggestions.push(
            ...companies
              .map((c) => c.company)
              .filter((c): c is string => !!c)
          );
          break;

        case 'location':
          // Search locations from database
          const locations = await prisma.job.findMany({
            where: {
              location: {
                contains: query,
                mode: 'insensitive',
              },
              isActive: true,
            },
            select: { location: true },
            distinct: ['location'],
            take: 8,
            orderBy: { createdAt: 'desc' },
          });
          suggestions.push(
            ...locations
              .map((l) => l.location)
              .filter((l): l is string => !!l)
          );
          break;

        case 'skills':
          // Search skills from database
          const jobsWithSkills = await prisma.job.findMany({
            where: {
              skills: {
                contains: query,
                mode: 'insensitive',
              },
              isActive: true,
            },
            select: { skills: true },
            take: 20,
          });

          const skillSet = new Set<string>();
          jobsWithSkills.forEach((job) => {
            if (job.skills) {
              try {
                // Try parsing as JSON array
                const parsed = JSON.parse(job.skills);
                if (Array.isArray(parsed)) {
                  parsed.forEach((skill: string) => {
                    if (
                      typeof skill === 'string' &&
                      skill.toLowerCase().includes(searchTerm)
                    ) {
                      skillSet.add(skill);
                    }
                  });
                }
              } catch {
                // If not JSON, treat as comma-separated
                const skills = job.skills.split(',').map((s) => s.trim());
                skills.forEach((skill) => {
                  if (skill.toLowerCase().includes(searchTerm)) {
                    skillSet.add(skill);
                  }
                });
              }
            }
          });
          suggestions.push(...Array.from(skillSet).slice(0, 8));
          break;

        case 'project':
          // For projects, use context-aware suggestions
          // Can't effectively search DB for project names
          return [];

        default:
          return [];
      }

      // Remove duplicates and limit
      return Array.from(new Set(suggestions)).slice(0, 8);
    } catch (error) {
      console.error('Database search error:', error);
      return [];
    }
  }

  /**
   * Get cached suggestions
   */
  private async getCachedSuggestions(
    cacheKey: string
  ): Promise<string[] | null> {
    // Try Redis first
    if (this.redis && this.redis.get) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < CACHE_TTL) {
            return parsed.data;
          }
        }
      } catch {
        // Redis failed, fall back to memory cache
      }
    }

    // Fall back to memory cache
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    return null;
  }

  /**
   * Cache suggestions
   */
  private async cacheSuggestions(
    cacheKey: string,
    suggestions: string[]
  ): Promise<void> {
    const cacheData = {
      data: suggestions,
      timestamp: Date.now(),
    };

    // Try Redis first
    if (this.redis && this.redis.set) {
      try {
        await this.redis.set(
          cacheKey,
          JSON.stringify(cacheData),
          Math.floor(CACHE_TTL / 1000)
        );
        return;
      } catch {
        // Redis failed, fall back to memory cache
      }
    }

    // Fall back to memory cache
    memoryCache.set(cacheKey, cacheData);

    // Clean old entries (keep max 1000)
    if (memoryCache.size > 1000) {
      const firstKey = memoryCache.keys().next().value;
      memoryCache.delete(firstKey);
    }
  }

  /**
   * Generate hybrid suggestions: Instant DB search + AI enhancement
   */
  async getSuggestions(
    field: string,
    query: string,
    context: Record<string, unknown>
  ): Promise<ResumeAutocompleteResult> {
    const startTime = Date.now();
    const cacheKey = `resume:autocomplete:${field}:${query.toLowerCase()}:${JSON.stringify(context).slice(0, 50)}`;

    // Check cache first
    const cached = await this.getCachedSuggestions(cacheKey);
    if (cached) {
      return {
        suggestions: cached,
        source: 'database',
        confidence: 85,
        responseTime: Date.now() - startTime,
      };
    }

    // Phase 1: Get instant database suggestions (0-50ms)
    const dbSuggestions = await this.getInstantDBSuggestions(
      field,
      query,
      context
    );

    // If we have good DB suggestions and query is short, return immediately
    if (dbSuggestions.length >= 3 && query.length <= 5) {
      const result = {
        suggestions: dbSuggestions,
        source: 'database' as const,
        confidence: 80,
        responseTime: Date.now() - startTime,
      };

      // Cache the result
      await this.cacheSuggestions(cacheKey, dbSuggestions);

      // Trigger AI enhancement in background (don't wait)
      this.enhanceWithAI(field, query, context, dbSuggestions, cacheKey).catch(
        (error) => {
          console.debug('Background AI enhancement failed:', error);
        }
      );

      return result;
    }

    // Phase 2: Get AI-enhanced suggestions (500-1000ms)
    try {
      const aiResult = await this.hybridAI.generateSuggestions(
        field,
        query,
        context
      );

      // Combine DB and AI suggestions
      const allSuggestions = [
        ...dbSuggestions,
        ...aiResult.suggestions,
      ];

      // Remove duplicates while preserving order
      // For summary field, return more suggestions (up to 8), for others limit to 10
      const maxSuggestions = field === 'summary' ? 8 : 10;
      const uniqueSuggestions = Array.from(
        new Map(
          allSuggestions.map((s) => [s.toLowerCase(), s])
        ).values()
      ).slice(0, maxSuggestions);

      const result = {
        suggestions: uniqueSuggestions.length > 0 ? uniqueSuggestions : dbSuggestions,
        source: uniqueSuggestions.length > dbSuggestions.length ? 'hybrid' : 'database',
        confidence: aiResult.confidence,
        responseTime: Date.now() - startTime,
      };

      // Cache the result
      await this.cacheSuggestions(cacheKey, result.suggestions);

      return result;
    } catch (error) {
      console.error('❌ AI enhancement failed, using DB suggestions:', error);
      if (error instanceof Error) {
        console.error('AI error details:', {
          message: error.message,
          stack: error.stack?.substring(0, 200),
          field,
          query: query.substring(0, 50),
        });
      }

      // Return DB suggestions as fallback
      const result = {
        suggestions: dbSuggestions.length > 0 ? dbSuggestions : [],
        source: dbSuggestions.length > 0 ? 'database' : 'fallback',
        confidence: dbSuggestions.length > 0 ? 70 : 30,
        responseTime: Date.now() - startTime,
      };

      // Cache the result
      if (result.suggestions.length > 0) {
        await this.cacheSuggestions(cacheKey, result.suggestions);
      }

      return result;
    }
  }

  /**
   * Background AI enhancement (non-blocking)
   */
  private async enhanceWithAI(
    field: string,
    query: string,
    context: Record<string, unknown>,
    existingSuggestions: string[],
    cacheKey: string
  ): Promise<void> {
    try {
      const aiResult = await this.hybridAI.generateSuggestions(
        field,
        query,
        context
      );

      // Combine and update cache with enhanced suggestions
      const enhanced = [
        ...existingSuggestions,
        ...aiResult.suggestions,
      ];

      const uniqueEnhanced = Array.from(
        new Map(enhanced.map((s) => [s.toLowerCase(), s])).values()
      ).slice(0, 10);

      await this.cacheSuggestions(cacheKey, uniqueEnhanced);
    } catch (error) {
      // Silently fail - we already have DB suggestions
      console.debug('Background AI enhancement error:', error);
    }
  }
}

// Singleton instance
let autocompleteService: ResumeAutocompleteService | null = null;

export function getResumeAutocompleteService(): ResumeAutocompleteService {
  if (!autocompleteService) {
    autocompleteService = new ResumeAutocompleteService();
  }
  return autocompleteService;
}

