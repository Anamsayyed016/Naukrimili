import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createJobSchema } from '@/lib/validation/job';

// GET /api/jobs - Enhanced job search with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Basic search parameters
    const q = searchParams.get('q') || undefined;
    const location = searchParams.get('location') || undefined;
    const company = searchParams.get('company') || undefined;
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const skip = (page - 1) * limit;
    
    // Advanced filters
    const jobType = searchParams.get('job_type') || undefined;
    const experienceLevel = searchParams.get('experience_level') || undefined;
    const sector = searchParams.get('sector') || undefined;
    const isRemote = searchParams.get('remote') === 'true';
    const salaryMin = searchParams.get('salary_min') ? parseInt(searchParams.get('salary_min')!) : undefined;
    const salaryMax = searchParams.get('salary_max') ? parseInt(searchParams.get('salary_max')!) : undefined;
    const country = searchParams.get('country') || 'IN';
    
    // Date filters
    const datePosted = searchParams.get('date_posted') || undefined;
    
    // Sorting
    const sortBy = searchParams.get('sort_by') || 'newest';
    
    // Skills filter
    const skills = searchParams.get('skills')?.split(',').filter(Boolean) || [];

    // Build where clause
    const where: any = {
      country: country
    };
    
    // Text search across title, company, and description
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    
    // Location filter
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    
    // Company filter
    if (company) {
      where.company = { contains: company, mode: 'insensitive' };
    }
    
    // Job type filter
    if (jobType) {
      where.jobType = jobType;
    }
    
    // Experience level filter
    if (experienceLevel) {
      where.experienceLevel = experienceLevel;
    }
    
    // Sector filter
    if (sector) {
      where.sector = sector;
    }
    
    // Remote filter
    if (isRemote) {
      where.isRemote = true;
    }
    
    // Salary range filter
    if (salaryMin || salaryMax) {
      where.AND = where.AND || [];
      if (salaryMin) {
        where.AND.push({
          OR: [
            { salaryMin: { gte: salaryMin } },
            { salaryMax: { gte: salaryMin } }
          ]
        });
      }
      if (salaryMax) {
        where.AND.push({
          OR: [
            { salaryMin: { lte: salaryMax } },
            { salaryMax: { lte: salaryMax } }
          ]
        });
      }
    }
    
    // Date posted filter
    if (datePosted && datePosted !== 'any') {
      const now = new Date();
      const daysAgo = datePosted === '1' ? 1 : 
                     datePosted === '7' ? 7 : 
                     datePosted === '30' ? 30 : 0;
      if (daysAgo > 0) {
        const dateThreshold = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        where.createdAt = { gte: dateThreshold };
      }
    }
    
    // Skills filter
    if (skills.length > 0) {
      where.skills = {
        hasSome: skills
      };
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'salary_high':
        orderBy = [{ salaryMax: 'desc' }, { salaryMin: 'desc' }];
        break;
      case 'salary_low':
        orderBy = [{ salaryMin: 'asc' }, { salaryMax: 'asc' }];
        break;
      case 'relevance':
      default:
        orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
        break;
    }

    // Execute queries
    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({ 
        where, 
        orderBy,
        skip, 
        take: limit,
        select: {
          id: true,
          title: true,
          company: true,
          companyLogo: true,
          location: true,
          description: true,
          salary: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          jobType: true,
          experienceLevel: true,
          skills: true,
          isRemote: true,
          isHybrid: true,
          isUrgent: true,
          isFeatured: true,
          sector: true,
          applyUrl: true,
          postedAt: true,
          createdAt: true
        }
      }),
    ]);

    // Transform jobs to match frontend expectations
    const transformedJobs = jobs.map(job => ({
      id: job.id.toString(),
      title: job.title,
      company: job.company || 'Unknown Company',
      companyLogo: job.companyLogo,
      location: job.location || 'Remote',
      description: job.description,
      salary_formatted: formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency || 'INR'),
      time_ago: getTimeAgo(job.createdAt),
      redirect_url: job.applyUrl || `/jobs/${job.id}`,
      is_remote: job.isRemote,
      is_hybrid: job.isHybrid,
      is_urgent: job.isUrgent,
      is_featured: job.isFeatured,
      job_type: job.jobType,
      experience_level: job.experienceLevel,
      skills: job.skills,
      sector: job.sector,
      posted_at: job.postedAt?.toISOString(),
      created_at: job.createdAt.toISOString()
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ 
      success: true, 
      jobs: transformedJobs,
      pagination: {
        page, 
        limit, 
        total, 
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      filters: {
        applied: {
          q, location, company, jobType, experienceLevel, 
          sector, isRemote, salaryMin, salaryMax, datePosted, skills
        },
        available: await getAvailableFilters(where)
      }
    });
    
  } catch (error) {
    console.error('Jobs GET error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch jobs',
      jobs: [],
      pagination: { page: 1, limit: 20, total: 0, total_pages: 0, has_next: false, has_prev: false }
    }, { status: 500 });
  }
}

// Helper function to format salary
function formatSalary(min?: number | null, max?: number | null, currency = 'INR'): string {
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency;
  
  if (!min && !max) return 'Salary not disclosed';
  
  const formatAmount = (amount: number) => {
    if (currency === 'INR') {
      if (amount >= 100000) {
        return `${(amount / 100000).toFixed(1)}L`;
      }
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toLocaleString();
  };
  
  if (min && max) {
    return `${symbol}${formatAmount(min)} - ${formatAmount(max)}`;
  } else if (min) {
    return `${symbol}${formatAmount(min)}+`;
  } else if (max) {
    return `Up to ${symbol}${formatAmount(max)}`;
  }
  
  return 'Salary not disclosed';
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'Just now';
}

// Helper function to get available filter options based on current results
async function getAvailableFilters(baseWhere: any) {
  try {
    const [jobTypes, experienceLevels, sectors, locations, companies] = await Promise.all([
      prisma.job.groupBy({
        by: ['jobType'],
        where: { ...baseWhere, jobType: { not: null } },
        _count: true,
        orderBy: { _count: { jobType: 'desc' } }
      }),
      prisma.job.groupBy({
        by: ['experienceLevel'],
        where: { ...baseWhere, experienceLevel: { not: null } },
        _count: true,
        orderBy: { _count: { experienceLevel: 'desc' } }
      }),
      prisma.job.groupBy({
        by: ['sector'],
        where: { ...baseWhere, sector: { not: null } },
        _count: true,
        orderBy: { _count: { sector: 'desc' } }
      }),
      prisma.job.groupBy({
        by: ['location'],
        where: { ...baseWhere, location: { not: null } },
        _count: true,
        orderBy: { _count: { location: 'desc' } },
        take: 20
      }),
      prisma.job.groupBy({
        by: ['company'],
        where: { ...baseWhere, company: { not: null } },
        _count: true,
        orderBy: { _count: { company: 'desc' } },
        take: 20
      })
    ]);

    return {
      jobTypes: jobTypes.map(item => ({ value: item.jobType, count: item._count })),
      experienceLevels: experienceLevels.map(item => ({ value: item.experienceLevel, count: item._count })),
      sectors: sectors.map(item => ({ value: item.sector, count: item._count })),
      locations: locations.map(item => ({ value: item.location, count: item._count })),
      companies: companies.map(item => ({ value: item.company, count: item._count }))
    };
  } catch (error) {
    console.error('Error getting available filters:', error);
    return {
      jobTypes: [],
      experienceLevels: [],
      sectors: [],
      locations: [],
      companies: []
    };
  }
}

// POST /api/jobs - create (enhanced schema fields)
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = createJobSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', issues: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const job = await prisma.job.create({
      data: {
        source: data.source,
        sourceId: data.sourceId,
        title: data.title,
        company: data.company ?? null,
        location: data.location ?? null,
        country: data.country,
        description: data.description,
        applyUrl: data.applyUrl ?? null,
        postedAt: data.postedAt ? new Date(data.postedAt as any) : null,
        salary: data.salary ?? null,
        rawJson: data.rawJson || {},
      } as any, // TEMP: stale Prisma client types missing source/sourceId
    });
    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    console.error('Jobs POST error:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Duplicate (source, sourceId)' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Failed to create job' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';