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
      // Exclude unprofessional jobs (sample, dynamic, seeded) - protect employer jobs (source='manual')
      source: {
        notIn: ['sample', 'dynamic', 'seeded']
      }
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

    // Enhanced dynamic location filtering - works for city, state, country, or any combination
    if (location) {
      // Split by comma to support "Mumbai, India" or "New York, USA" format
      const locationParts = location.split(',').map(part => part.trim()).filter(Boolean);
      
      // Create OR conditions for each part to match against location string or country
      const locationConditions = locationParts.flatMap(part => [
        { location: { contains: part, mode: 'insensitive' } },
        { country: { contains: part, mode: 'insensitive' } }
      ]);
      
      // Also match full location string if country is specified
      if (country) {
        locationConditions.push({ country: { contains: country.toUpperCase(), mode: 'insensitive' } });
      }
      
      // If there's already an OR clause (from query), combine with AND
      if (where.OR) {
        where.AND = [
          ...(where.AND || []),
          { OR: where.OR },
          { OR: locationConditions }
        ];
        delete where.OR;
      } else {
        // Otherwise, use OR directly
        where.OR = locationConditions;
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
      // Preserve source filter when adding AND conditions
      if (where.source && !where.AND) {
        where.AND = [{ source: where.source }];
        delete where.source;
      }
      where.AND = [
        ...(where.AND || []),
        { OR: [ { postedAt: { gte: cutoff } }, { createdAt: { gte: cutoff } } ] },
        { OR: [ { expiryDate: null }, { expiryDate: { gt: now } } ] }
      ];
    }
    
    // Ensure source filter is in AND if AND exists
    if (where.AND && where.source) {
      where.AND.push({ source: where.source });
      delete where.source;
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
    
    // QUALITY FILTER: Remove unprofessional jobs with generic descriptions
    const professionalJobs = validJobs.filter(job => {
      // Essential fields check
      if (!job.title || !job.company || !job.description) {
        return false;
      }
      
      // Filter out jobs with very short descriptions (likely unprofessional)
      if (job.description && job.description.length < 50) {
        return false;
      }
      
      // Filter out generic template descriptions
      const descLower = (job.description || '').toLowerCase();
      const unprofessionalPatterns = [
        'this is a sample job description',
        'we are looking for a',
        'join our team',
        'great opportunity',
        'dynamic environment',
        'this is a comprehensive job description',
        'sample job',
        'test job',
        'placeholder'
      ];
      
      // Check if description is too generic (matches multiple patterns)
      const matchesGenericPattern = unprofessionalPatterns.filter(pattern => 
        descLower.includes(pattern)
      ).length >= 2; // If matches 2+ generic patterns, likely unprofessional
      
      if (matchesGenericPattern && descLower.length < 200) {
        return false;
      }
      
      return true;
    });
    
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
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}