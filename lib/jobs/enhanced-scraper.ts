/**
 * Job scraping facade — external sources disabled; returns empty scrape results safely.
 */

import { prisma } from '@/lib/prisma';

export interface JobSource {
  name: string;
  enabled: boolean;
  rateLimit: number;
  lastRequest?: number;
}

export interface ScrapingConfig {
  sources: JobSource[];
  batchSize: number;
  maxJobsPerSource: number;
  enableDeduplication: boolean;
  enableCaching: boolean;
  cacheTTL: number;
}

export interface ScrapingResult {
  source: string;
  jobsFound: number;
  jobsAdded: number;
  duplicatesSkipped: number;
  errors: string[];
  duration: number;
}

export class EnhancedJobScraper {
  private config: ScrapingConfig;

  constructor(config?: Partial<ScrapingConfig>) {
    this.config = {
      sources: [
        { name: 'adzuna', enabled: false, rateLimit: 60 },
        { name: 'jsearch', enabled: false, rateLimit: 100 },
        { name: 'reed', enabled: false, rateLimit: 30 },
        { name: 'indeed', enabled: false, rateLimit: 50 },
        { name: 'linkedin', enabled: false, rateLimit: 20 },
      ],
      batchSize: 50,
      maxJobsPerSource: 200,
      enableDeduplication: true,
      enableCaching: true,
      cacheTTL: 30,
      ...config,
    };
  }

  async scrapeAllSources(
    query: string = '',
    countries: string[] = ['IN', 'US', 'GB', 'AE']
  ): Promise<ScrapingResult[]> {
    console.log(
      `ℹ️ External scraping disabled; skipping sources for query "${query}" (${countries.join(', ')})`
    );
    return this.config.sources
      .filter((s) => s.enabled)
      .map((source) => ({
        source: source.name,
        jobsFound: 0,
        jobsAdded: 0,
        duplicatesSkipped: 0,
        errors: ['External job providers disabled'],
        duration: 0,
      }));
  }

  async scrapeSource(
    sourceName: string,
    _query: string,
    _countries: string[]
  ): Promise<ScrapingResult> {
    return {
      source: sourceName,
      jobsFound: 0,
      jobsAdded: 0,
      duplicatesSkipped: 0,
      errors: ['External job providers disabled'],
      duration: 0,
    };
  }

  async getScrapingStats(): Promise<{
    totalJobs: number;
    jobsBySource: { source: string | null; _count: { id: number } }[];
    lastScraping: string;
  }> {
    const stats = await prisma.job.groupBy({
      by: ['source'],
      _count: { id: true },
    });

    return {
      totalJobs: await prisma.job.count(),
      jobsBySource: stats,
      lastScraping: new Date().toISOString(),
    };
  }

  clearCache(): void {
    // no-op
  }
}

export const jobScraper = new EnhancedJobScraper();
