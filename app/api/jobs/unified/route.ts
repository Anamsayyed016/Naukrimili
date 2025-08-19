import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs } from '@/lib/jobs/providers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const country = searchParams.get('country') || 'IN';
    const source = searchParams.get('source') || 'all'; // 'db', 'external', 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeExternal = searchParams.get('includeExternal') === 'true';

    let allJobs: any[] = [];
    let totalJobs = 0;

    // 1. Fetch from Database
    if (source === 'db' || source === 'all') {
      const dbWhere: any = { isActive: true };
      
      if (query) {
        dbWhere.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ];
      }
      
      if (location) {
        dbWhere.location = { contains: location, mode: 'insensitive' };
      }
      
      if (country) {
        dbWhere.country = country;
      }

      const dbJobs = await prisma.job.findMany({
        where: dbWhere,
        skip: (page - 1) * limit,
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
      });

      const dbFormattedJobs = dbJobs.map(job => ({
        id: job.id,
        title: job.title,
        company: job.company || job.companyRelation?.name,
        companyLogo: job.companyLogo || job.companyRelation?.logo,
        location: job.location,
        country: job.country,
        description: job.description,
        applyUrl: job.applyUrl,
        postedAt: job.postedAt,
        salary: job.salary,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        skills: job.skills,
        isRemote: job.isRemote,
        isFeatured: job.isFeatured,
        source: 'database',
        createdAt: job.createdAt
      }));

      allJobs.push(...dbFormattedJobs);
      totalJobs += dbJobs.length;
    }

    // 2. Fetch from External APIs (if requested)
    if (includeExternal && (source === 'external' || source === 'all')) {
      try {
        const externalJobs = await fetchExternalJobs(query, location, country, page);
        const externalFormattedJobs = externalJobs.map((job, index) => ({
          id: `ext-${Date.now()}-${index}`,
          title: job.title,
          company: job.company,
          companyLogo: null,
          location: job.location,
          country: job.country,
          description: job.description,
          applyUrl: job.applyUrl,
          postedAt: job.postedAt,
          salary: job.salary,
          jobType: 'Full-time',
          experienceLevel: 'Not specified',
          skills: [],
          isRemote: false,
          isFeatured: false,
          source: job.source,
          createdAt: new Date()
        }));

        allJobs.push(...externalFormattedJobs);
        totalJobs += externalJobs.length;
      } catch (error) {
        console.error('External job fetch failed:', error);
        // Continue with database jobs only
      }
    }

    // 3. Sort and paginate combined results
    allJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = allJobs.slice(startIndex, endIndex);

    const totalPages = Math.ceil(totalJobs / limit);

    return NextResponse.json({
      success: true,
      jobs: paginatedJobs,
      pagination: {
        page,
        limit,
        total: totalJobs,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      sources: {
        database: source === 'db' || source === 'all',
        external: includeExternal && (source === 'external' || source === 'all')
      },
      search: {
        query,
        location,
        country,
        source
      }
    });

  } catch (error: any) {
    console.error('Unified Jobs API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch jobs', details: error?.message },
      { status: 500 }
    );
  }
}

async function fetchExternalJobs(query: string, location: string, country: string, page: number) {
  const allExternalJobs: any[] = [];
  
  try {
    // Fetch from Adzuna
    const adzunaJobs = await fetchFromAdzuna(query || 'software developer', country.toLowerCase(), page);
    allExternalJobs.push(...adzunaJobs);
  } catch (error) {
    console.error('Adzuna fetch failed:', error);
  }

  try {
    // Fetch from JSearch
    const jsearchJobs = await fetchFromJSearch(query || 'software developer', country.toUpperCase(), page);
    allExternalJobs.push(...jsearchJobs);
  } catch (error) {
    console.error('JSearch fetch failed:', error);
  }

  try {
    // Fetch from Google Jobs
    const googleJobs = await fetchFromGoogleJobs(query || 'software developer', location || 'India', page);
    allExternalJobs.push(...googleJobs);
  } catch (error) {
    console.error('Google Jobs fetch failed:', error);
  }

  return allExternalJobs;
}
