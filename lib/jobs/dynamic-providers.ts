/**
 * Dynamic provider facade — external integrations removed; re-exports noop registry.
 */
import { fetchFromJSearch as fetchJSearchNormalized } from './provider-registry';
import type { NormalizedJob } from './types';

export type DynamicJob = {
  id: string;
  source: string;
  sourceId: string;
  title: string;
  company: string;
  location: string;
  country: string;
  description: string;
  requirements?: string;
  applyUrl?: string;
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

function toDynamicJob(job: NormalizedJob, index: number): DynamicJob {
  return {
    id: job.sourceId || `ext-${index}`,
    source: job.source,
    sourceId: job.sourceId,
    title: job.title,
    company: job.company || '',
    location: job.location || '',
    country: job.country,
    description: job.description,
    requirements: job.requirements,
    applyUrl: job.applyUrl,
    source_url: job.source_url,
    postedAt: job.postedAt,
    salary: job.salary,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    jobType: job.jobType,
    experienceLevel: job.experienceLevel,
    skills: job.skills,
    isRemote: job.isRemote,
    isHybrid: job.isHybrid,
    isUrgent: job.isUrgent,
    isFeatured: job.isFeatured,
    isActive: job.isActive,
    sector: job.sector,
    views: job.views,
    applicationsCount: job.applicationsCount,
    raw: job.raw,
  };
}

export async function fetchFromJSearch(
  query: string,
  location: string = 'India',
  page: number = 1
): Promise<DynamicJob[]> {
  const jobs = await fetchJSearchNormalized(query, 'IN', page, location);
  return jobs.map(toDynamicJob);
}

export async function fetchFromRapidAPI(
  _query: string,
  _location: string = 'India',
  _page: number = 1
): Promise<DynamicJob[]> {
  return [];
}

export async function generateDynamicJobs(
  _query: string,
  _location: string = 'India',
  _count: number = 10
): Promise<DynamicJob[]> {
  return [];
}
