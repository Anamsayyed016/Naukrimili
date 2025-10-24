import { prisma } from '@/lib/prisma';
import { NormalizedJob } from './providers';

/**
 * Upsert a normalized external job into the Job table using the composite unique (source, sourceId).
 * Returns the persisted Job record or null if required identifiers are missing.
 */
export async function upsertNormalizedJob(job: Partial<NormalizedJob>) {
  if (!job?.source || !job?.sourceId) return null;
  const postedAtDate = job.postedAt ? new Date(job.postedAt) : null;
  try {
    return await (prisma as any).job.upsert({
      where: { source_sourceId: { source: job.source, sourceId: job.sourceId } },
      update: {
        title: job.title || '',
        company: job.company || null,
        location: job.location || null,
        country: job.country?.slice(0, 2).toUpperCase() || 'US',
        description: job.description || '',
        requirements: (job as any).requirements || '',
        applyUrl: job.applyUrl || null,  // @deprecated - keep for backward compatibility
        apply_url: job.apply_url || null, // New internal application URL
        source_url: job.source_url || null, // New external source URL
        postedAt: postedAtDate || undefined,
        salary: (job as any).salary || null,
        salaryMin: (job as any).salaryMin || null,
        salaryMax: (job as any).salaryMax || null,
        salaryCurrency: (job as any).salaryCurrency || 'INR',
        jobType: (job as any).jobType || 'full-time',
        experienceLevel: (job as any).experienceLevel || 'mid',
        skills: (job as any).skills || '',
        isRemote: (job as any).isRemote || false,
        isHybrid: (job as any).isHybrid || false,
        isUrgent: (job as any).isUrgent || false,
        isFeatured: (job as any).isFeatured || false,
        isActive: true,
        sector: (job as any).sector || 'Technology',
        views: 0,
        applicationsCount: 0,
        rawJson: (job as any).raw,
      },
      create: {
        source: job.source,
        sourceId: job.sourceId,
        title: job.title || '',
        company: job.company || null,
        location: job.location || null,
        country: job.country?.slice(0, 2).toUpperCase() || 'US',
        description: job.description || '',
        requirements: (job as any).requirements || '',
        applyUrl: job.applyUrl || null,  // @deprecated - keep for backward compatibility
        apply_url: job.apply_url || null, // New internal application URL
        source_url: job.source_url || null, // New external source URL
        postedAt: postedAtDate,
        salary: (job as any).salary || null,
        salaryMin: (job as any).salaryMin || null,
        salaryMax: (job as any).salaryMax || null,
        salaryCurrency: (job as any).salaryCurrency || 'INR',
        jobType: (job as any).jobType || 'full-time',
        experienceLevel: (job as any).experienceLevel || 'mid',
        skills: (job as any).skills || '',
        isRemote: (job as any).isRemote || false,
        isHybrid: (job as any).isHybrid || false,
        isUrgent: (job as any).isUrgent || false,
        isFeatured: (job as any).isFeatured || false,
        isActive: true,
        sector: (job as any).sector || 'Technology',
        views: 0,
        applicationsCount: 0,
        rawJson: (job as any).raw,
      },
    });
  } catch (e) {
    return null;
  }
}

// Compatibility wrapper for simple job inputs using `url` instead of `applyUrl`
export async function upsertJob(job: any) {
  if (!job?.source || !job?.sourceId) return null;
  const mapped: Partial<NormalizedJob> = {
    source: job.source,
    sourceId: job.sourceId,
    title: job.title || '',
    company: job.company || null,
    location: job.location || null,
    country: (job.country || 'US').toString().slice(0, 2).toUpperCase(),
    description: job.description || '',
    applyUrl: job.applyUrl || job.url || null,
    postedAt: job.postedAt || undefined,
    salary: job.salary || undefined,
    raw: job.raw || job,
  };
  return upsertNormalizedJob(mapped);
}

/**
 * Bulk helper: upsert an array of normalized jobs concurrently with a concurrency limit (default 10).
 */
export async function upsertNormalizedJobs(jobs: Partial<NormalizedJob>[], concurrency = 10) {
  const results: any[] = [];
  let index = 0;
  async function worker() {
    while (index < jobs.length) {
      const current = jobs[index++];
      const r = await upsertNormalizedJob(current);
      if (r) results.push(r);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, jobs.length) }, worker);
  await Promise.all(workers);
  return results;
}
