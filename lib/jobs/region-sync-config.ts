/** Country priority and provider matrix for scheduled ingestion. */
export type SyncRegion = 'IN' | 'US' | 'GB' | 'AE';

export interface RegionSyncConfig {
  code: SyncRegion;
  adzunaCode?: string;
  serpLocation: string;
  joobleLocation?: string;
  enableAdzuna: boolean;
  enableSerpApi: boolean;
  enableJooble: boolean;
  enableUSAJobs: boolean;
  /** Suggested cron interval in hours (documented for ops; use /api/jobs/sync). */
  refreshIntervalHours: number;
}

export const REGION_SYNC_CONFIG: Record<SyncRegion, RegionSyncConfig> = {
  IN: {
    code: 'IN',
    adzunaCode: 'in',
    serpLocation: 'India',
    joobleLocation: 'India',
    enableAdzuna: true,
    enableSerpApi: true,
    enableJooble: true,
    enableUSAJobs: false,
    refreshIntervalHours: 6,
  },
  US: {
    code: 'US',
    adzunaCode: 'us',
    serpLocation: 'United States',
    joobleLocation: 'United States',
    enableAdzuna: true,
    enableSerpApi: true,
    enableJooble: true,
    enableUSAJobs: true,
    refreshIntervalHours: 6,
  },
  GB: {
    code: 'GB',
    adzunaCode: 'gb',
    serpLocation: 'United Kingdom',
    joobleLocation: 'United Kingdom',
    enableAdzuna: true,
    enableSerpApi: true,
    enableJooble: true,
    enableUSAJobs: false,
    refreshIntervalHours: 12,
  },
  AE: {
    code: 'AE',
    serpLocation: 'United Arab Emirates',
    joobleLocation: 'United Arab Emirates',
    enableAdzuna: false,
    enableSerpApi: true,
    enableJooble: true,
    enableUSAJobs: false,
    refreshIntervalHours: 12,
  },
};

export const SYNC_REGION_PRIORITY: SyncRegion[] = ['IN', 'US', 'GB', 'AE'];
