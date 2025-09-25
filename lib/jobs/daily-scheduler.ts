import { EnhancedJobUpsertService } from './enhanced-upsert';
import { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs, fetchFromJooble } from './providers';

export interface SchedulerConfig {
  queries: string[];
  countries: string[];
  maxJobsPerQuery: number;
  enableAdzuna: boolean;
  enableJSearch: boolean;
  enableGoogleJobs: boolean;
  enableJooble: boolean;
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
    'developer'
  ],
  countries: ['IN', 'US', 'GB', 'CA', 'AU'],
  maxJobsPerQuery: 50,
  enableAdzuna: true,
  enableJSearch: true,
  enableGoogleJobs: true,
  enableJooble: true
};

export class DailyJobScheduler {
  private config: SchedulerConfig;

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Run the daily job fetching process
   */
  async runDailySync(): Promise<{
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
    console.log('🚀 Starting daily job sync...');

    const stats = {
      totalFetched: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      expired: 0,
      errors: [] as string[],
      duration: 0
    };

    try {
      // Step 1: Mark expired jobs as inactive
      console.log('📅 Marking expired jobs as inactive...');
      stats.expired = await EnhancedJobUpsertService.markExpiredJobsInactive();

      // Step 2: Fetch fresh jobs from all sources
      console.log('🌐 Fetching fresh jobs from external APIs...');
      const allJobs = await this.fetchAllJobs();
      stats.totalFetched = allJobs.length;

      // Step 3: Upsert jobs to database
      console.log('💾 Upserting jobs to database...');
      const upsertResult = await EnhancedJobUpsertService.upsertJobs(allJobs);
      stats.created = upsertResult.created;
      stats.updated = upsertResult.updated;
      stats.skipped = upsertResult.skipped;
      stats.errors = upsertResult.errors;

      // Step 4: Log final statistics
      stats.duration = Date.now() - startTime;
      console.log('✅ Daily job sync completed:', stats);

      return {
        success: true,
        stats
      };

    } catch (error) {
      console.error('❌ Daily job sync failed:', error);
      stats.duration = Date.now() - startTime;
      stats.errors.push(`Scheduler error: ${error instanceof Error ? error.message : 'Unknown error'}`);

      return {
        success: false,
        stats
      };
    }
  }

  /**
   * Fetch jobs from all configured sources
   */
  private async fetchAllJobs() {
    const allJobs: any[] = [];
    const { queries, countries, maxJobsPerQuery } = this.config;

    for (const query of queries) {
      for (const country of countries) {
        console.log(`🔍 Fetching jobs for "${query}" in ${country}...`);

        try {
          // Fetch from Adzuna
          if (this.config.enableAdzuna) {
            try {
              const adzunaJobs = await fetchFromAdzuna(query, country.toLowerCase(), 1, {
                location: undefined,
                distanceKm: 25
              });
              allJobs.push(...adzunaJobs.slice(0, maxJobsPerQuery));
              console.log(`✅ Adzuna: ${adzunaJobs.length} jobs for "${query}" in ${country}`);
            } catch (error) {
              console.warn(`⚠️ Adzuna failed for "${query}" in ${country}:`, error);
            }
          }

          // Fetch from JSearch
          if (this.config.enableJSearch) {
            try {
              const jsearchJobs = await fetchFromJSearch(query, country.toUpperCase(), 1);
              allJobs.push(...jsearchJobs.slice(0, maxJobsPerQuery));
              console.log(`✅ JSearch: ${jsearchJobs.length} jobs for "${query}" in ${country}`);
            } catch (error) {
              console.warn(`⚠️ JSearch failed for "${query}" in ${country}:`, error);
            }
          }

          // Fetch from Google Jobs
          if (this.config.enableGoogleJobs) {
            try {
              const googleJobs = await fetchFromGoogleJobs(query, country, 1);
              allJobs.push(...googleJobs.slice(0, maxJobsPerQuery));
              console.log(`✅ Google Jobs: ${googleJobs.length} jobs for "${query}" in ${country}`);
            } catch (error) {
              console.warn(`⚠️ Google Jobs failed for "${query}" in ${country}:`, error);
            }
          }

          // Fetch from Jooble
          if (this.config.enableJooble) {
            try {
              const joobleJobs = await fetchFromJooble(query, country, 1, {
                radius: 25,
                countryCode: country.toLowerCase()
              });
              allJobs.push(...joobleJobs.slice(0, maxJobsPerQuery));
              console.log(`✅ Jooble: ${joobleJobs.length} jobs for "${query}" in ${country}`);
            } catch (error) {
              console.warn(`⚠️ Jooble failed for "${query}" in ${country}:`, error);
            }
          }

        } catch (error) {
          console.error(`❌ Error fetching jobs for "${query}" in ${country}:`, error);
        }
      }
    }

    // Remove duplicates based on source and sourceId
    const uniqueJobs = this.removeDuplicates(allJobs);
    console.log(`📊 Total unique jobs fetched: ${uniqueJobs.length}`);

    return uniqueJobs;
  }

  /**
   * Remove duplicate jobs based on source and sourceId
   */
  private removeDuplicates(jobs: any[]): any[] {
    const seen = new Set<string>();
    return jobs.filter(job => {
      const key = `${job.source || 'unknown'}-${job.sourceId || job.id || 'unknown'}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Get scheduler statistics
   */
  async getStats() {
    return await EnhancedJobUpsertService.getJobStats();
  }

  /**
   * Test the scheduler with a small batch
   */
  async testSync(testQueries: string[] = ['software engineer'], testCountries: string[] = ['IN']) {
    console.log('🧪 Running test sync...');
    
    const testConfig: SchedulerConfig = {
      ...this.config,
      queries: testQueries,
      countries: testCountries,
      maxJobsPerQuery: 5
    };

    const testScheduler = new DailyJobScheduler(testConfig);
    return await testScheduler.runDailySync();
  }
}

// Export a default instance
export const dailyScheduler = new DailyJobScheduler();
