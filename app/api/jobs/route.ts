import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const company = searchParams.get('company') || '';
    const jobType = searchParams.get('jobType') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const isRemote = searchParams.get('isRemote') === 'true';
    const sector = searchParams.get('sector') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {
      isActive: true
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } },
        { skills: { hasSome: [query] } }
      ];
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (company) {
      where.company = { contains: company, mode: 'insensitive' };
    }

    if (jobType) {
      where.jobType = jobType;
    }

    if (experienceLevel) {
      where.experienceLevel = experienceLevel;
    }

    if (isRemote !== undefined) {
      where.isRemote = isRemote;
    }

    if (sector) {
      where.sector = { contains: sector, mode: 'insensitive' };
    }

    // Get jobs with pagination
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        select: {
          id: true,
          title: true,
          company: true,
          companyLogo: true,
          location: true,
          country: true,
          salary: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          jobType: true,
          experienceLevel: true,
          isRemote: true,
          isHybrid: true,
          isUrgent: true,
          isFeatured: true,
          sector: true,
          skills: true,
          postedAt: true,
          applyUrl: true,
          views: true,
          applications: true,
          createdAt: true
        },
        orderBy: [
          { isFeatured: 'desc' },
          { isUrgent: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.job.count({ where })
    ]);

    // Transform data for frontend
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company,
      companyLogo: job.companyLogo,
      location: job.location,
      country: job.country,
      salary: job.salary,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      isRemote: job.isRemote,
      isHybrid: job.isHybrid,
      isUrgent: job.isUrgent,
      isFeatured: job.isFeatured,
      sector: job.sector,
      skills: job.skills,
      postedAt: job.postedAt,
      applyUrl: job.applyUrl,
      views: job.views,
      applications: job.applications,
      createdAt: job.createdAt
    }));

    return NextResponse.json({
      success: true,
      jobs: transformedJobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch jobs'
    }, { status: 500 });
  }
}
