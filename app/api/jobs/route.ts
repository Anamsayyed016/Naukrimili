import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterValidJobs } from "@/lib/jobs/job-id-validator";

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
    const limit = parseInt(searchParams.get("limit") || "10");
    const view = (searchParams.get('view') || '').toLowerCase(); // 'list' requests lightweight payload
    const skip = (page - 1) * limit;
    const daysParam = searchParams.get('days');
    const now = new Date();
    const cutoff = daysParam ? new Date(now.getTime() - Math.max(1, parseInt(daysParam)) * 24 * 60 * 60 * 1000) : undefined;

    // Build dynamic where clause for filtering
    const where: any = {
      isActive: true
    };

    // Text search across multiple fields
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
        { skills: { contains: query, mode: 'insensitive' } }
      ];
    }

    // Location filtering (be lenient when country is also provided)
    if (location) {
      const locationCondition = { location: { contains: location, mode: 'insensitive' } };
      // If a country filter is present, don't over-restrict with location; allow jobs that match country even if
      // the free-text location (e.g., "Dubai") isn't present in the saved location string (e.g., "United Arab Emirates").
      if (country) {
        where.AND = [
          ...(where.AND || []),
          { OR: [ locationCondition, { country: country.toUpperCase() } ] }
        ];
      } else if (where.OR) {
        where.AND = [
          { OR: where.OR },
          locationCondition
        ];
        delete where.OR;
      } else {
        where.location = { contains: location, mode: 'insensitive' };
      }
    }

    // Company filtering
    if (company) {
      where.company = { contains: company, mode: 'insensitive' };
    }

    // Job type filtering
    if (jobType && jobType !== 'all') {
      where.jobType = { contains: jobType, mode: 'insensitive' };
    }

    // Experience level filtering
    if (experienceLevel && experienceLevel !== 'all') {
      where.experienceLevel = { contains: experienceLevel, mode: 'insensitive' };
    }

    // Remote work filtering
    if (isRemote) {
      where.isRemote = true;
    }

    // Sector filtering
    if (sector) {
      where.sector = { contains: sector, mode: 'insensitive' };
    }

    // Country filtering
    if (country) {
      where.country = country.toUpperCase();
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
        jobs: validJobs,
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
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}