import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterValidJobs } from "@/lib/jobs/job-id-validator";
import {
  jobTypeSearchVariants,
  experienceLevelSearchVariants,
  passesJobListingQualityCheck,
  applyJobTextSearchToWhere,
  applyJobLocationToWhere,
} from "@/lib/job-data-normalizer";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching jobs with filters...');
    
    const { searchParams } = new URL(request.url);
    
    // Parse search parameters
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const company = searchParams.get('company') || '';
    const jobType = searchParams.get('jobType') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const isRemote = searchParams.get('isRemote') === 'true';
    const sector = searchParams.get('sector') || '';
    const country = searchParams.get('country') || '';
    const salaryMin = searchParams.get('salaryMin') || '';
    const salaryMax = searchParams.get('salaryMax') || '';
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "200"); // Increased default from 10 to 200 for better UX
    const view = (searchParams.get('view') || '').toLowerCase(); // 'list' requests lightweight payload
    const skip = (page - 1) * limit;
    const daysParam = searchParams.get('days');
    const now = new Date();
    const cutoff = daysParam ? new Date(now.getTime() - Math.max(1, parseInt(daysParam)) * 24 * 60 * 60 * 1000) : undefined;

    // Build dynamic where clause for filtering
    // EXCLUDE: Sample, dynamic, and seeded jobs - only show professional/real jobs
    const where: any = {
      isActive: true,
      AND: [
        {
          OR: [
            { source: null },
            { source: { notIn: ['sample', 'dynamic', 'seeded'] } },
          ],
        },
      ],
    };

    if (query) {
      applyJobTextSearchToWhere(where, query);
    }

    if (location) {
      applyJobLocationToWhere(where, location, country);
    }

    // Company filtering
    if (company) {
      where.company = { contains: company, mode: 'insensitive' };
    }

    if (jobType && jobType !== 'all') {
      const jobTypeVariants = jobTypeSearchVariants(jobType);
      where.AND = [
        ...(where.AND || []),
        {
          OR: jobTypeVariants.map((variant) => ({
            jobType: { contains: variant, mode: 'insensitive' as const },
          })),
        },
      ];
    }

    if (experienceLevel && experienceLevel !== 'all') {
      const experienceVariants = experienceLevelSearchVariants(experienceLevel);
      where.AND = [
        ...(where.AND || []),
        {
          OR: experienceVariants.map((variant) => ({
            experienceLevel: { contains: variant, mode: 'insensitive' as const },
          })),
        },
      ];
    }

    // Remote work filtering
    if (isRemote) {
      where.isRemote = true;
    }

    // Sector filtering
    if (sector) {
      where.sector = { contains: sector, mode: 'insensitive' };
    }

    // Country filtering — employer/manual jobs always visible (parity with /api/jobs/unlimited)
    const countryCode = country?.trim().toUpperCase();
    if (countryCode && countryCode !== 'ALL') {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { source: { in: ['manual', 'employer'] } },
            { country: countryCode },
          ],
        },
      ];
    }

    // Salary filtering
    if (salaryMin) {
      where.salaryMin = { gte: parseInt(salaryMin) };
    }
    if (salaryMax) {
      where.salaryMax = { lte: parseInt(salaryMax) };
    }

    // Freshness filtering when days param is provided
    if (cutoff && !isNaN(cutoff.getTime())) {
      where.AND = [
        ...(where.AND || []),
        { OR: [ { postedAt: { gte: cutoff } }, { createdAt: { gte: cutoff } } ] },
        { OR: [ { expiryDate: null }, { expiryDate: { gt: now } } ] }
      ];
    }

    console.log('🔍 Search filters applied:', {
      query, location, company, jobType, experienceLevel, isRemote, sector, country, salaryMin, salaryMax
    });

    const [jobs, total] = await Promise.all([
      view === 'list'
        ? prisma.job.findMany({
            where,
            select: {
              id: true,
              sourceId: true,
              source: true,
              title: true,
              company: true,
              location: true,
              country: true,
              description: true,
              salary: true,
              salaryMin: true,
              salaryMax: true,
              salaryCurrency: true,
              jobType: true,
              experienceLevel: true,
              isRemote: true,
              isHybrid: true,
              isFeatured: true,
              postedAt: true,
              createdAt: true,
              source_url: true,
              _count: { select: { applications: true, bookmarks: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          })
        : prisma.job.findMany({
            where,
            include: {
              applications: {
                select: {
                  id: true,
                  status: true,
                  appliedAt: true,
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
              // Ensure country is present on non-list view as well
              // Prisma include doesn't need explicit selection for scalar fields when using findMany with include,
              // but we keep it for clarity in case of future refactors.
              _count: { select: { applications: true, bookmarks: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
      prisma.job.count({ where }),
    ]);

    // CRITICAL: Filter out jobs with invalid IDs (decimals from Math.random())
    const validJobs = filterValidJobs(jobs);
    
    const professionalJobs = validJobs.filter(passesJobListingQualityCheck);
    
    if (validJobs.length !== professionalJobs.length) {
      console.log(`🔄 Quality filter: Removed ${validJobs.length - professionalJobs.length} unprofessional jobs`);
    }
    
    // Use actual database count, not just filtered page results
    // FIXED: This ensures location counts are accurate
    const actualTotal = total; // Database count with filters applied
    
    // Avoid extra aggregates for list view to reduce latency
    const stats = view === 'list'
      ? undefined
      : await prisma.job.aggregate({ _count: { id: true } });
    const totalApplications = view === 'list'
      ? undefined
      : await prisma.application.count();

    return NextResponse.json({
      success: true,
      data: {
        jobs: professionalJobs,
        pagination: {
          page,
          limit,
          total: actualTotal, // FIXED: Use actual database count for location counts
          totalPages: Math.ceil(actualTotal / limit)
        },
        ...(stats ? { stats: { totalJobs: stats._count.id, totalApplications } } : {})
      }
    }, { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=600' } });
  } catch (_error) {
    console.error("Error fetching jobs:", _error);

    // Graceful fallback: if DB is unavailable/misconfigured, return external/unified results
    // while keeping the existing response shape (data.jobs, data.pagination) for clients.
    try {
      const url = new URL(request.url);
      const fallbackParams = new URLSearchParams(url.searchParams);

      // Ensure unified route fetches external jobs and never returns samples by default
      fallbackParams.set('includeExternal', 'true');
      fallbackParams.set('includeSamples', 'false');

      // IMPORTANT: unified defaults to IN when neither country nor countries is provided.
      // For the main jobs feed, fetch across our target countries unless user explicitly chose a country.
      if (!fallbackParams.get('country') && !fallbackParams.get('countries')) {
        fallbackParams.set('countries', 'IN,US,GB,AE');
      }

      const fallbackUrl = new URL('/api/jobs/unified', url.origin);
      fallbackUrl.search = fallbackParams.toString();

      const fallbackRes = await fetch(fallbackUrl.toString(), { cache: 'no-store' });
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        if (fallbackData?.success) {
          const jobs = fallbackData.jobs || fallbackData.data?.jobs || [];
          const p = fallbackData.pagination || fallbackData.data?.pagination || {};

          return NextResponse.json({
            success: true,
            data: {
              jobs,
              pagination: {
                page: p.page ?? parseInt(url.searchParams.get('page') || '1'),
                limit: p.limit ?? parseInt(url.searchParams.get('limit') || '200'),
                total: p.total ?? jobs.length,
                totalPages: p.totalPages ?? Math.ceil((p.total ?? jobs.length) / (p.limit ?? parseInt(url.searchParams.get('limit') || '200')))
              }
            }
          }, { headers: { 'Cache-Control': 'no-store' } });
        }
      }
    } catch (fallbackError) {
      console.error('❌ /api/jobs fallback to unified failed:', fallbackError);
    }

    // Last resort: return empty but successful payload so UI doesn't hard-fail.
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '200');
      return NextResponse.json({
        success: true,
        data: {
          jobs: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      }, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
      return NextResponse.json({
        success: true,
        data: {
          jobs: [],
          pagination: { page: 1, limit: 200, total: 0, totalPages: 0 }
        }
      }, { headers: { 'Cache-Control': 'no-store' } });
    }
  }
}