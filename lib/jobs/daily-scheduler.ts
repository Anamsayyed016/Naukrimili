import { EnhancedJobUpsertService } from './enhanced-upsert';
import { fetchJobsForRegion } from './provider-registry';
import {
  REGION_SYNC_CONFIG,
  SYNC_REGION_PRIORITY,
  type SyncRegion,
} from './region-sync-config';
import { toEnhancedJobData } from './fetchers/helpers';
import type { NormalizedJob } from './types';

export interface SchedulerConfig {
  queries: string[];
  regions: SyncRegion[];
  maxJobsPerQuery: number;
}

const DEFAULT_CONFIG: SchedulerConfig = {
  queries: [
    'software engineer',
    'data scientist',
    'product manager',
    'marketing manager',
    'sales executive',
    'accountant',
    'nurse',
    'teacher',
    'designer',
    'developer',
  ],
  regions: SYNC_REGION_PRIORITY,
  maxJobsPerQuery: 50,
};

export class DailyJobScheduler {
  private config: SchedulerConfig;

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async runDailySync(regions?: SyncRegion[]): Promise<{
    success: boolean;
    stats: {
      totalFetched: number;
      created: number;
      updated: number;
      skipped: number;
      expired: number;
      errors: string[];
      duration: number;
    };
  }> {
    const startTime = Date.now();
    const targetRegions = regions?.length ? regions : this.config.regions;
    console.log(`Starting job sync for regions: ${targetRegions.join(', ')}`);

    const stats = {
      totalFetched: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      expired: 0,
      errors: [] as string[],
      duration: 0,
    };

    try {
      stats.expired = await EnhancedJobUpsertService.markExpiredJobsInactive();

      const allJobs = await this.fetchAllJobs(targetRegions);
      stats.totalFetched = allJobs.length;

      const enhanced = allJobs.map(toEnhancedJobData);
      const upsertResult = await EnhancedJobUpsertService.upsertJobs(enhanced);
      stats.created = upsertResult.created;
      stats.updated = upsertResult.updated;
      stats.skipped = upsertResult.skipped;
      stats.errors = upsertResult.errors;

      stats.duration = Date.now() - startTime;
      console.log('Job sync completed:', stats);

      return { success: true, stats };
    } catch (error) {
      console.error('Job sync failed:', error);
      stats.duration = Date.now() - startTime;
      stats.errors.push(
        `Scheduler error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return { success: false, stats };
    }
  }

  private async fetchAllJobs(regions: SyncRegion[]): Promise<NormalizedJob[]> {
    const allJobs: NormalizedJob[] = [];
    const { queries, maxJobsPerQuery } = this.config;

    for (const region of regions) {
      const cfg = REGION_SYNC_CONFIG[region];
      console.log(`Region ${region} (refresh every ${cfg.refreshIntervalHours}h recommended)`);

      for (const query of queries) {
        try {
          const jobs = await fetchJobsForRegion(query, region, 1);
          allJobs.push(...jobs.slice(0, maxJobsPerQuery));
          console.log(`Fetched ${jobs.length} jobs for "${query}" in ${region}`);
        } catch (error) {
          console.warn(`Fetch failed for "${query}" in ${region}:`, error);
        }
      }
    }

    return this.removeDuplicates(allJobs);
  }

  private removeDuplicates(jobs: NormalizedJob[]): NormalizedJob[] {
    const seen = new Set<string>();
    return jobs.filter((job) => {
      const key = `${job.source}-${job.sourceId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async getStats() {
    return EnhancedJobUpsertService.getJobStats();
  }

  async testSync(
    testQueries: string[] = ['software engineer'],
    testRegions: SyncRegion[] = ['IN']
  ) {
    const testScheduler = new DailyJobScheduler({
      ...this.config,
      queries: testQueries,
      regions: testRegions,
      maxJobsPerQuery: 5,
    });
    return testScheduler.runDailySync(testRegions);
  }
}

export const dailyScheduler = new DailyJobScheduler();
