import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveJobRouteParam, extCompositeLookupVariants, extractExtFromSlug } from "@/lib/jobs/resolve-job-lookup";
import { logJobApiTiming, withTimeout, type JobApiTimings } from "@/lib/jobs/api-perf";
import { jobCacheService } from "@/lib/job-cache-service";

/** Detail page only needs counts — not full application rows with user joins */
const jobDetailInclude = {
  _count: { select: { applications: true, bookmarks: true } },
} as const;

const EXTERNAL_SOURCES = ['adzuna', 'jooble', 'serpapi', 'usajobs', 'jsearch'] as const;
/** Cap live provider fallback so nginx never hits 504 on cache/DB miss */
const DETAIL_EXTERNAL_FETCH_MS = 8000;

async function findByPrefixedSourceIds(
  numericId: string,
  preferredSource?: string
) {
  const sources = preferredSource
    ? [preferredSource, ...EXTERNAL_SOURCES.filter((s) => s !== preferredSource)]
    : [...EXTERNAL_SOURCES];

  for (const source of sources) {
    for (const sourceId of [numericId, `${source}-${numericId}`, `${source}_${numericId}`]) {
      const row = await prisma.job.findFirst({
        where: { source, sourceId },
        include: jobDetailInclude,
      });
      if (row) return row;
    }
  }
  return null;
}

/** Return live-fetched external jobs when DB upsert is unavailable or slow. */
function externalJobToDetailRow(external: Record<string, unknown>) {
  const skills = external.skills;
  return {
    id: external.id ?? external.sourceId,
    source: String(external.source || 'external'),
    sourceId: String(external.sourceId || ''),
    title: String(external.title || ''),
    company: (external.company as string | null) ?? null,
    companyLogo: null,
    location: (external.location as string | null) ?? null,
    country: String(external.country || 'IN'),
    description: String(external.description || ''),
    requirements: String(external.requirements || ''),
    applyUrl: (external.applyUrl as string | null) ?? (external.source_url as string | null) ?? null,
    source_url: (external.source_url as string | null) ?? (external.applyUrl as string | null) ?? null,
    postedAt: external.postedAt ? new Date(String(external.postedAt)) : null,
    salary: (external.salary as string | null) ?? null,
    salaryMin: (external.salaryMin as number | null) ?? null,
    salaryMax: (external.salaryMax as number | null) ?? null,
    salaryCurrency: (external.salaryCurrency as string | null) ?? null,
    jobType: (external.jobType as string | null) ?? 'full-time',
    experienceLevel: (external.experienceLevel as string | null) ?? 'mid',
    skills: Array.isArray(skills) ? skills.join(', ') : String(skills || ''),
    isRemote: Boolean(external.isRemote),
    isHybrid: Boolean(external.isHybrid),
    isUrgent: Boolean(external.isUrgent),
    isFeatured: Boolean(external.isFeatured),
    isActive: true,
    sector: (external.sector as string | null) ?? 'General',
    views: 0,
    applicationsCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { applications: 0, bookmarks: 0 },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const startTime = Date.now();
  const timings: JobApiTimings = {};
  try {
    // Next.js 15 compatibility: params can be a Promise
    const resolvedParams = params instanceof Promise ? await params : params;
    const routeParam = decodeURIComponent(resolvedParams.id);
    console.log('🔍 Fetching job details for route param:', routeParam);

    const resolution = resolveJobRouteParam(routeParam);
    const jobId = resolution.resolvedId;

    if (!jobId) {
      return NextResponse.json(
        {
          error: "Job not found",
          details: "Invalid job URL format. Please check the URL and try again.",
          success: false,
        },
        { status: 404 }
      );
    }

    console.log('✅ Resolved route param:', {
      raw: resolution.raw,
      resolvedId: jobId,
      extComposite: resolution.extComposite,
    });

    let job;

    // Strategy -1: listing detail cache (job visible in search but not yet in DB)
    const detailCacheKeys = [
      routeParam,
      jobId,
      resolution.extComposite
        ? `ext-${resolution.extComposite.source}-${resolution.extComposite.sourceId}`
        : null,
      resolution.extComposite?.sourceId,
    ].filter(Boolean) as string[];
    for (const cacheKey of detailCacheKeys) {
      const cachedJob = await jobCacheService.get<Record<string, unknown>>(
        cacheKey,
        'job_detail'
      );
      if (cachedJob?.title) {
        job = externalJobToDetailRow(cachedJob);
        timings.cacheHit = true;
        console.log('✅ Found job in listing detail cache:', cacheKey);
        break;
      }
    }

    // Strategy 0: ext-{source}-{sourceId} from listings (incl. ext-external-adzuna-* legacy URLs)
    if (!job && resolution.extComposite) {
      for (const variant of extCompositeLookupVariants(resolution.extComposite)) {
        job = await prisma.job.findFirst({
          where: { source: variant.source, sourceId: variant.sourceId },
          include: jobDetailInclude,
        });
        if (job) {
          console.log('✅ Found job by source+sourceId:', variant.source, variant.sourceId, job.title);
          break;
        }
      }
    }

    const numericId = resolution.numericId ?? NaN;
    const isNumericString = /^\d+$/.test(jobId);
    const isLargeNumericId = resolution.isLargeNumericId;
    const isSafeInteger = resolution.isSafeInteger;
    
    // Strategy 1: For large numeric IDs (10+ digits), ALWAYS try sourceId first
    // These are external job IDs that exceed safe integer limits
    // CRITICAL FIX: Some jobs have negative sourceIds (e.g., -8203584465841679000)
    // but URLs contain positive IDs (e.g., 8203584465841679000)
    // Try both positive and negative versions
    if (!job && isLargeNumericId) {
      console.log('🔍 Large numeric ID detected (10+ digits), trying sourceId lookup first...');
      
      // Try positive sourceId first
      job = await prisma.job.findFirst({
        where: { sourceId: jobId },
        include: jobDetailInclude
      });
      
      // If not found, try negative version (some jobs are stored with negative sourceIds)
      if (!job) {
        console.log('🔍 Trying negative sourceId variant...');
        const negativeSourceId = `-${jobId}`;
        job = await prisma.job.findFirst({
          where: { sourceId: negativeSourceId },
          include: jobDetailInclude
        });
        if (job) {
          console.log('✅ Found job by negative sourceId:', job.title);
        }
      } else {
        console.log('✅ Found job by sourceId (large numeric ID):', job.title);
      }
      
      if (!job) {
        console.log('⚠️ Job not found by sourceId (tried both positive and negative), will try other strategies...');
      }
    }
    
    // Strategy 2: Try as numeric ID for database jobs (but only if it's a safe integer AND not already found)
    // JavaScript's Number.MAX_SAFE_INTEGER is 9007199254740991 (2^53 - 1)
    if (!job && isSafeInteger && !isLargeNumericId) {
      console.log('🔍 Trying Strategy 2 (numeric ID for database jobs)...');
      job = await prisma.job.findUnique({
        where: { id: numericId },
        include: jobDetailInclude
      });
      console.log('✅ Strategy 2 (numeric ID):', job ? 'Found' : 'Not found');
    } else if (!job && !isSafeInteger && !isLargeNumericId) {
      console.log('⚠️ Skipping numeric ID strategy - ID is not a safe integer:', jobId);
    }
    
    // Strategy 3b: Adzuna/Jooble store sourceId as "{provider}-{numericId}" while URLs use bare numbers
    if (!job) {
      const numericLookup = isNumericString
        ? jobId
        : resolution.extComposite?.sourceId && /^\d+$/.test(resolution.extComposite.sourceId)
          ? resolution.extComposite.sourceId
          : null;
      if (numericLookup) {
        job = await findByPrefixedSourceIds(numericLookup, resolution.extComposite?.source);
        if (job) {
          console.log('✅ Found job by prefixed sourceId:', job.source, job.sourceId);
        }
      }
    }

    // Strategy 3: Try by sourceId for all jobs (external-*, ext-*, string IDs, etc.)
    // This catches external jobs and any job with a sourceId match
    // CRITICAL FIX: Also try negative version for numeric IDs
    if (!job) {
      console.log('🔍 Trying Strategy 3 (sourceId for all job types):', jobId);
      job = await prisma.job.findFirst({
        where: { 
          sourceId: jobId
        },
        include: jobDetailInclude
      });
      
      // If numeric ID and not found, try negative version
      if (!job && isNumericString && jobId.length >= 10) {
        console.log('🔍 Trying negative sourceId variant in Strategy 3...');
        const negativeSourceId = `-${jobId}`;
        job = await prisma.job.findFirst({
          where: { 
            sourceId: negativeSourceId
          },
          include: jobDetailInclude
        });
        if (job) {
          console.log('✅ Found job by negative sourceId in Strategy 3:', job.title);
        }
      } else if (job) {
        console.log('✅ Found job by sourceId:', job.title);
      }
    }
    
    // Strategy 3: For IDs like "external-123456-1", extract the timestamp and try
    if (!job && jobId.startsWith('external-')) {
      const parts = jobId.split('-');
      if (parts.length >= 2) {
        const timestamp = parts[1];
        job = await prisma.job.findFirst({
          where: { 
            sourceId: {
              contains: timestamp
            }
          },
          include: jobDetailInclude
        });
      }
    }

    // Strategy 4: For numeric IDs, try partial matching on sourceId (last 10+ digits)
    if (!job && isNumericString && jobId.length >= 6) {
      console.log('🔍 Strategy 4: Trying partial sourceId match (last digits)...');
      const lastDigits = jobId.slice(-15); // Last 15 digits
      // Try both positive and negative versions with contains
      const candidates = [lastDigits, `-${lastDigits}`];
      for (const candidate of candidates) {
        job = await prisma.job.findFirst({
          where: { 
            sourceId: { contains: candidate }
          },
          include: jobDetailInclude
        });
        if (job) {
          console.log('✅ Found job by partial sourceId match:', job.title);
          break;
        }
      }
    }
    
    // Strategy 5: Wait for external job to be cached if it's a recent search
    // This handles race condition where user clicks job before background caching completes
    if (!job && !isSafeInteger) {
      console.log('🔍 Strategy 5: Waiting for potential external job caching...');
      
      // Wait a brief moment for background caching to complete
      await new Promise(resolve => setTimeout(resolve, 250));
      
      // Try sourceId lookup again (both positive and negative)
      job = await prisma.job.findFirst({
        where: { sourceId: jobId },
        include: jobDetailInclude
      });
      
      if (!job && isNumericString && jobId.length >= 10) {
        const negativeSourceId = `-${jobId}`;
        job = await prisma.job.findFirst({
          where: { sourceId: negativeSourceId },
          include: jobDetailInclude
        });
      }
      
      if (job) {
        console.log('✅ Found external job after waiting for cache:', job.title);
      }
    }
    
    // Strategy 6: Live external fetch when listing showed a job not yet persisted (sync/upsert lag)
    if (!job) {
      const countryHint =
        request.nextUrl.searchParams.get('country') ||
        undefined;
      const extFromSlug = extractExtFromSlug(routeParam);
      const lookup =
        resolution.extComposite ||
        extFromSlug ||
        (isNumericString ? { source: 'external', sourceId: jobId } : null);

      if (lookup) {
        console.log('🔍 Strategy 6: Fetching external job for lookup:', lookup);
        try {
          const { resolveAndPersistExternalJob } = await import(
            '@/lib/jobs/fetch-external-by-id'
          );
          const externalFetchStart = Date.now();
          const externalJob = await withTimeout(
            resolveAndPersistExternalJob(lookup, {
              countryHint,
              maxPages: 1,
            }),
            DETAIL_EXTERNAL_FETCH_MS,
            'detail-external-fetch'
          );
          timings.externalMs = Date.now() - externalFetchStart;
          if (externalJob) {
            const persistedId =
              typeof externalJob.id === 'number'
                ? externalJob.id
                : parseInt(String(externalJob.id), 10);
            if (!Number.isNaN(persistedId) && persistedId > 0) {
              job = await prisma.job.findUnique({
                where: { id: persistedId },
                include: jobDetailInclude,
              });
            }
            if (!job && externalJob.source && externalJob.sourceId) {
              job = await prisma.job.findFirst({
                where: {
                  source: String(externalJob.source),
                  sourceId: String(externalJob.sourceId),
                },
                include: jobDetailInclude,
              });
            }
            if (!job && externalJob.title) {
              job = externalJobToDetailRow(
                externalJob as unknown as Record<string, unknown>
              );
            }
            if (job) {
              console.log('✅ Found external job via live provider fetch:', job.title);
            }
          }
        } catch (externalErr) {
          console.warn(
            '⚠️ External job fetch fallback failed:',
            externalErr instanceof Error ? externalErr.message : externalErr
          );
        }
      }
    }

    if (!job) {
      console.log('❌ Job not found with any strategy:', jobId);
      console.log('🔍 Debug info:', {
        originalId: resolvedParams.id,
        parsedId: jobId,
        isNumericString,
        isLargeNumericId,
        isSafeInteger,
        numericId: numericId.toString()
      });
      
      // Additional debug: Try to find similar jobs to help diagnose
      if (isLargeNumericId) {
        const similarJobs = await prisma.job.findMany({
          where: {
            OR: [
              { sourceId: { contains: jobId.slice(-10) } }, // Last 10 digits
              { sourceId: { contains: `-${jobId}` } } // Negative version
            ]
          },
          select: { id: true, sourceId: true, title: true },
          take: 3
        });
        if (similarJobs.length > 0) {
          console.log('🔍 Found similar jobs:', similarJobs);
        }
      }
      
      return NextResponse.json(
        { 
          error: "Job not found",
          details: `No job found with ID: ${jobId}. The job may have expired or been removed.`,
          success: false,
          debug: process.env.NODE_ENV === 'development' ? {
            originalId: resolvedParams.id,
            parsedId: jobId,
            strategiesTried: ['large-numeric-sourceId', 'numeric-id', 'sourceId', 'negative-sourceId']
          } : undefined
        },
        { status: 404 }
      );
    }

    console.log('✅ Job found:', job.id, 'sourceId:', job.sourceId);

    // Increment views atomically (best-effort; ignore failures)
    const jobWithViews = job as typeof job & { views?: number };
    let updatedViews = jobWithViews.views || 0;
    try {
      // CRITICAL FIX: Ensure job.id is a valid integer before updating
      const jobIdNum = typeof job.id === 'number' ? job.id : parseInt(String(job.id), 10);
      if (!isNaN(jobIdNum) && Number.isSafeInteger(jobIdNum) && jobIdNum > 0) {
        const updated = await prisma.job.update({
          where: { id: jobIdNum },
          data: { views: { increment: 1 } },
          select: { views: true }
        });
        updatedViews = updated.views;
      } else {
        console.warn('⚠️ Skipping views increment - invalid job.id:', job.id);
      }
    } catch (_incErr: unknown) {
      // If job.id is not numeric or column missing, skip silently
      const incErrMessage = _incErr instanceof Error ? _incErr.message : 'Unknown error';
      console.warn('⚠️ Failed to increment views:', incErrMessage);
    }

    // Normalize response: expose applicationsCount and views consistently
    // CRITICAL FIX: Use correct relation name 'applications' (lowercase, plural) not 'Application'
    const jobWithCount = job as typeof job & { 
      _count?: { applications?: number; bookmarks?: number };
      applicationsCount?: number;
    };
    const applicationsCount = jobWithCount._count?.applications ?? jobWithCount.applicationsCount ?? 0;
    
    // Ensure country field is set (fix for "region not available" error)
    const country = job.country || 'IN'; // Default to India if not set
    
    // CRITICAL FIX: Construct safe response object to avoid Prisma serialization issues
    // NextResponse.json can handle Date objects, but we ensure _count is properly formatted
    const normalizedJob: Record<string, unknown> = {
      ...job,
      country, // Ensure country is always present
      applicationsCount,
      views: updatedViews,
      // Ensure _count is properly structured (fix for undefined _count.Application error)
      _count: {
        applications: applicationsCount,
        bookmarks: jobWithCount._count?.bookmarks ?? 0
      }
    };
    
    // Remove any undefined values that might cause serialization issues
    Object.keys(normalizedJob).forEach(key => {
      if (normalizedJob[key] === undefined) {
        delete normalizedJob[key];
      }
    });

    timings.totalMs = Date.now() - startTime;
    logJobApiTiming('GET /api/jobs/[id]', timings, { jobId: job.id });

    return NextResponse.json({
      success: true,
      data: normalizedJob,
      meta: { performance: { responseTimeMs: timings.totalMs } },
    });

  } catch (error: unknown) {
    console.error("❌ Error fetching job details:", error);
    const errorObj = error instanceof Error ? error : { message: 'Unknown error', stack: undefined };
    console.error("❌ Error stack:", errorObj.stack);
    console.error("❌ Error message:", errorObj.message);
    
    // Provide more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? errorObj.message || "Failed to fetch job details"
      : "Failed to fetch job details";
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorObj.stack : undefined,
        success: false
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Next.js 15 compatibility: params can be a Promise
    const resolvedParams = params instanceof Promise ? await params : params;
    const jobId = parseInt(resolvedParams.id);
    
    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: "Invalid job ID" },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting job ${jobId}...`);

    // Delete the job
    await prisma.job.delete({
      where: { id: jobId }
    });

    console.log(`✅ Job ${jobId} deleted successfully`);

    return NextResponse.json({
      success: true,
      message: "Job deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}