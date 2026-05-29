/**
 * Shared job normalization shape for upsert and external listing merge.
 * External provider HTTP integrations are disabled; this type is preserved for DB upsert.
 */
export type NormalizedJob = {
  source: string;
  sourceId: string;
  title: string;
  company?: string;
  location?: string;
  country: string;
  description: string;
  requirements?: string;
  applyUrl?: string;
  apply_url?: string;
  source_url?: string;
  postedAt?: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  jobType?: string;
  experienceLevel?: string;
  skills?: string[];
  isRemote?: boolean;
  isHybrid?: boolean;
  isUrgent?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  sector?: string;
  views?: number;
  applicationsCount?: number;
  raw: unknown;
};
