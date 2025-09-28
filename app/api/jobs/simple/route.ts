import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    if (!request.url) {
      return NextResponse.json(
        { success: false, error: 'Invalid request URL' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse parameters
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const jobType = searchParams.get('jobType') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const isRemote = searchParams.get('isRemote') === 'true';
    const salaryMin = searchParams.get('salaryMin') || '';
    const salaryMax = searchParams.get('salaryMax') || '';
    const country = searchParams.get('country') || 'IN';
    
    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = { isActive: true };
    
    // Build OR conditions for text search (query and location)
    const orConditions: any[] = [];
    
    if (query) {
      orConditions.push(
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } }
      );
    }
    
    if (location) {
      orConditions.push({ location: { contains: location, mode: 'insensitive' } });
    }
    
    // Apply OR conditions if any exist
    if (orConditions.length > 0) {
      where.OR = orConditions;
    }
    
    if (jobType && jobType !== 'all') {
      // Enhanced job type filtering with multiple variations
      const jobTypeVariations = [
        jobType,
        jobType.replace('-', ' '),
        jobType.replace('-', ''),
        jobType.toLowerCase(),
        jobType.toUpperCase()
      ];
      
      where.OR = [
        ...(where.OR || []),
        ...jobTypeVariations.map(term => ({ jobType: { contains: term, mode: 'insensitive' } }))
      ];
    }
    
    if (experienceLevel && experienceLevel !== 'all') {
      // Enhanced experience level filtering with mapping
      const experienceMapping: { [key: string]: string[] } = {
        'entry level': ['entry', 'junior', 'associate', 'trainee', 'intern', 'entry level'],
        'mid level': ['mid', 'middle', 'intermediate', 'experienced', 'mid level'],
        'senior level': ['senior', 'lead', 'principal', 'staff', 'senior level'],
        'lead': ['lead', 'senior', 'principal', 'staff'],
        'executive': ['executive', 'director', 'manager', 'head', 'chief', 'executive']
      };
      
      const experienceTerms = experienceMapping[experienceLevel.toLowerCase()] || [experienceLevel];
      const allExperienceTerms = [
        ...experienceTerms,
        experienceLevel,
        experienceLevel.toLowerCase(),
        experienceLevel.toUpperCase()
      ];
      
      where.OR = [
        ...(where.OR || []),
        ...allExperienceTerms.map(term => ({ experienceLevel: { contains: term, mode: 'insensitive' } }))
      ];
    }
    
    if (isRemote) {
      // Enhanced remote work filtering
      where.OR = [
        ...(where.OR || []),
        { isRemote: true },
        { isHybrid: true },
        { description: { contains: 'remote', mode: 'insensitive' } },
        { description: { contains: 'work from home', mode: 'insensitive' } },
        { description: { contains: 'wfh', mode: 'insensitive' } },
        { title: { contains: 'remote', mode: 'insensitive' } }
      ];
    }
    
    if (country) {
      where.country = country;
    }
    
    // Add salary filtering
    if (salaryMin || salaryMax) {
      if (salaryMin) {
        where.salaryMin = { gte: parseInt(salaryMin) };
      }
      if (salaryMax) {
        where.salaryMax = { lte: parseInt(salaryMax) };
      }
    }
    
    console.log('🔍 Simple Jobs API Search:', { query, location, jobType, experienceLevel, isRemote, page, limit });
    
    // Get jobs from database
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          companyRelation: {
            select: {
              name: true,
              logo: true,
              location: true,
              industry: true
            }
          }
        }
      }),
      prisma.job.count({ where })
    ]);
    
    console.log(`✅ Simple API: Found ${jobs.length} jobs out of ${total} total`);
    
    // Convert to simple format
    const simpleJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      isRemote: job.isRemote,
      salaryRange: job.salaryRange,
      description: job.description?.substring(0, 200) + '...',
      requirements: job.requirements,
      benefits: job.benefits,
      skills: job.skills,
      postedAt: job.createdAt,
      companyLogo: job.companyRelation?.logo,
      companyIndustry: job.companyRelation?.industry
    }));
    
    return NextResponse.json({
      success: true,
      jobs: simpleJobs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalJobs: total,
        hasMore: skip + jobs.length < total,
        limit
      },
      meta: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/jobs/simple',
        searchTimeMs: Date.now() - startTime,
        source: 'database'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Simple Jobs API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch jobs',
        details: error.message,
        jobs: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalJobs: 0,
          hasMore: false,
          limit: 20
        }
      },
      { status: 500 }
    );
  }
}
