
import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs, fetchFromJooble } from '@/lib/jobs/providers';
import { prisma } from '@/lib/prisma';

// Cache for external API responses (5 minutes)
const externalCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get cached data or fetch new data
async function getCachedOrFetch(key: string, fetchFn: () => Promise<any>) {
  const cached = externalCache.get(key);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log(`📦 Using cached data for ${key}`);
    return cached.data;
  }
  
  try {
    const data = await fetchFn();
    externalCache.set(key, { data, timestamp: now });
    console.log(`💾 Cached data for ${key}`);
    return data;
  } catch (error) {
    console.warn(`⚠️ Failed to fetch ${key}:`, error);
    return cached?.data || [];
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate request
    if (!request.url) {
      console.error('❌ Invalid request URL in unified jobs API');
      return NextResponse.json(
        { success: false, error: 'Invalid request URL' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Validate and parse parameters with defaults
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const country = searchParams.get('country') || 'IN';
    const source = searchParams.get('source') || 'all';
    
    // Additional filter parameters
    const jobType = searchParams.get('jobType') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const isRemote = searchParams.get('isRemote') === 'true';
    const salaryMin = searchParams.get('salaryMin') || '';
    const salaryMax = searchParams.get('salaryMax') || '';
    const lat = searchParams.get('lat') || '';
    const lng = searchParams.get('lng') || '';
    const radius = searchParams.get('radius') || '25';
    const sortByDistance = searchParams.get('sortByDistance') === 'true';
    
    // Validate numeric parameters
    let page = 1;
    let limit = 50; // Increased default limit
    
    try {
      page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50'))); // Increased max limit
    } catch (parseError) {
      console.warn('⚠️ Parameter parsing error, using defaults:', parseError);
    }
    
    const includeExternal = searchParams.get('includeExternal') === 'true';

    // Get the first company ID to link sample jobs to a real company
    let sampleCompanyId = null;
    try {
      const firstCompany = await prisma.company.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true }
      });
      sampleCompanyId = firstCompany?.id || 'sample-company-default';
    } catch (error) {
      console.log('No company found, using default sample company ID');
      sampleCompanyId = 'sample-company-default';
    }

    // Sample jobs data for testing
    const sampleJobs = [
      {
        id: '1',
        title: 'Senior Software Engineer',
        company: 'TechCorp India',
        companyId: sampleCompanyId,
        location: 'Bangalore, India',
        country: 'IN',
        description: 'We are looking for a Senior Software Engineer to join our growing team. You will be responsible for developing and maintaining high-quality software solutions.',
        requirements: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
        skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker'],
        jobType: 'full-time',
        experienceLevel: 'senior',
        salary: '₹15,00,000 - ₹25,00,000',
        isRemote: false,
        isFeatured: true,
        isActive: true,
        source: 'manual',
        sourceId: 'sample-1',
        postedAt: new Date().toISOString(),
        applyUrl: '#',
        views: 150,
        applicationsCount: 25
      },
      {
        id: '2',
        title: 'Frontend Developer',
        company: 'Digital Solutions Ltd',
        companyId: sampleCompanyId,
        location: 'Mumbai, India',
        country: 'IN',
        description: 'Join our frontend team to build beautiful and responsive user interfaces. Experience with modern JavaScript frameworks required.',
        requirements: ['JavaScript', 'React', 'CSS', 'HTML'],
        skills: ['JavaScript', 'React', 'Vue.js', 'CSS3', 'HTML5', 'Webpack'],
        jobType: 'full-time',
        experienceLevel: 'mid',
        salary: '₹8,00,000 - ₹15,00,000',
        isRemote: true,
        isFeatured: false,
        isActive: true,
        source: 'manual',
        sourceId: 'sample-2',
        postedAt: new Date().toISOString(),
        applyUrl: '#',
        views: 89,
        applicationsCount: 12
      },
      {
        id: '3',
        title: 'Data Analyst',
        company: 'Analytics Pro',
        companyId: sampleCompanyId,
        location: 'Delhi, India',
        country: 'IN',
        description: 'We need a Data Analyst to help us make sense of large datasets and provide insights to drive business decisions.',
        requirements: ['Python', 'SQL', 'Excel', 'Statistics'],
        skills: ['Python', 'SQL', 'Excel', 'Statistics', 'Tableau', 'Power BI'],
        jobType: 'full-time',
        experienceLevel: 'entry',
        salary: '₹6,00,000 - ₹12,00,000',
        isRemote: false,
        isFeatured: false,
        isActive: true,
        source: 'manual',
        sourceId: 'sample-3',
        postedAt: new Date().toISOString(),
        applyUrl: '#',
        views: 67,
        applicationsCount: 8
      },
      {
        id: '4',
        title: 'Product Manager',
        company: 'InnovateTech',
        companyId: sampleCompanyId,
        location: 'Hyderabad, India',
        country: 'IN',
        description: 'Lead product development from concept to launch. Work with cross-functional teams to deliver exceptional user experiences.',
        requirements: ['Product Management', 'Agile', 'User Research', 'Analytics'],
        skills: ['Product Management', 'Agile', 'User Research', 'Analytics', 'Figma', 'JIRA'],
        jobType: 'full-time',
        experienceLevel: 'senior',
        salary: '₹20,00,000 - ₹35,00,000',
        isRemote: true,
        isFeatured: true,
        isActive: true,
        source: 'manual',
        sourceId: 'sample-4',
        postedAt: new Date().toISOString(),
        applyUrl: '#',
        views: 203,
        applicationsCount: 45
      },
      {
        id: '5',
        title: 'DevOps Engineer',
        company: 'Cloud Systems',
        companyId: sampleCompanyId,
        location: 'Pune, India',
        country: 'IN',
        description: 'Build and maintain our cloud infrastructure. Automate deployment processes and ensure system reliability.',
        requirements: ['AWS', 'Docker', 'Kubernetes', 'Linux'],
        skills: ['AWS', 'Docker', 'Kubernetes', 'Linux', 'Terraform', 'Jenkins'],
        jobType: 'full-time',
        experienceLevel: 'mid',
        salary: '₹12,00,000 - ₹20,00,000',
        isRemote: false,
        isFeatured: false,
        isActive: true,
        source: 'manual',
        sourceId: 'sample-5',
        postedAt: new Date().toISOString(),
        applyUrl: '#',
        views: 134,
        applicationsCount: 18
      },
      {
        id: '6',
        title: 'UX Designer',
        company: 'Creative Studio',
        companyId: sampleCompanyId,
        location: 'Chennai, India',
        country: 'IN',
        description: 'Create intuitive and engaging user experiences. Work closely with product and engineering teams.',
        requirements: ['Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping'],
        skills: ['Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping', 'Sketch', 'InVision'],
        jobType: 'full-time',
        experienceLevel: 'mid',
        salary: '₹10,00,000 - ₹18,00,000',
        isRemote: true,
        isFeatured: false,
        isActive: true,
        source: 'manual',
        sourceId: 'sample-6',
        postedAt: new Date().toISOString(),
        applyUrl: '#',
        views: 92,
        applicationsCount: 15
      },
      {
        id: '7',
        title: 'Software Engineer - Dubai',
        company: 'Global Tech Solutions',
        companyId: sampleCompanyId,
        location: 'Dubai, UAE',
        country: 'AE',
        description: 'Join our Dubai office as a Software Engineer. Work on cutting-edge projects with international teams.',
        requirements: ['Java', 'Spring Boot', 'Microservices', 'Docker'],
        skills: ['Java', 'Spring Boot', 'Microservices', 'Docker', 'Kubernetes', 'AWS'],
        jobType: 'full-time',
        experienceLevel: 'mid',
        salary: 'AED 15,000 - AED 25,000',
        isRemote: false,
        isFeatured: true,
        isActive: true,
        source: 'manual',
        sourceId: 'sample-7',
        postedAt: new Date().toISOString(),
        applyUrl: '#',
        views: 178,
        applicationsCount: 32
      },
      {
        id: '8',
        title: 'Marketing Manager',
        company: 'Growth Marketing Co',
        companyId: sampleCompanyId,
        location: 'Bangalore, India',
        country: 'IN',
        description: 'Drive marketing strategies and campaigns. Lead a team of marketing professionals.',
        requirements: ['Digital Marketing', 'Analytics', 'Team Management', 'Content Strategy'],
        skills: ['Digital Marketing', 'Google Analytics', 'Facebook Ads', 'Content Strategy', 'SEO', 'SEM'],
        jobType: 'full-time',
        experienceLevel: 'senior',
        salary: '₹12,00,000 - ₹20,00,000',
        isRemote: true,
        isFeatured: false,
        isActive: true,
        source: 'manual',
        sourceId: 'sample-8',
        postedAt: new Date().toISOString(),
        applyUrl: '#',
        views: 95,
        applicationsCount: 14
      }
    ];

    console.log(`🔍 Unified Jobs API: Searching with filters:`, { 
      query, location, country, source, page, limit, includeExternal,
      jobType, experienceLevel, isRemote, salaryMin, salaryMax, lat, lng, radius, sortByDistance
    });

    // Fetch database jobs first
    let databaseJobs: any[] = [];
    let databaseJobsCount = 0;
    
    try {
      console.log('🗄️ Fetching jobs from database...');
      
      // Build where clause for database query
      const where: any = { isActive: true };
      
      if (query && query.trim().length > 0) {
        where.OR = [
          { title: { contains: query.trim(), mode: 'insensitive' } },
          { company: { contains: query.trim(), mode: 'insensitive' } },
          { description: { contains: query.trim(), mode: 'insensitive' } }
        ];
      }
      
      if (location && location.trim().length > 0) {
        where.location = { contains: location.trim(), mode: 'insensitive' };
      }
      
      if (jobType && jobType !== 'all') {
        where.jobType = jobType;
      }
      
      if (experienceLevel && experienceLevel !== 'all') {
        where.experienceLevel = experienceLevel;
      }
      
      if (isRemote) {
        where.isRemote = true;
      }
      
      // Fetch database jobs
      databaseJobs = await prisma.job.findMany({
        where,
        take: 50, // Limit database jobs
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
      
      databaseJobsCount = databaseJobs.length;
      console.log(`✅ Database: Found ${databaseJobsCount} jobs`);
      
    } catch (dbError) {
      console.warn('⚠️ Database fetch failed:', dbError);
    }

    // Filter sample jobs based on search criteria
    let filteredJobs = sampleJobs;
    let externalJobs: any[] = [];
    let externalJobsCount = 0;

    // Fetch from external APIs if includeExternal is true
    if (includeExternal) {
      try {
        console.log('🌐 Fetching jobs from external APIs...');
        
        // Create cache key based on search parameters
        const cacheKey = `external-${query}-${location}-${country}-${page}`;
        
        // Fetch from Adzuna with caching
        const adzunaJobs = await getCachedOrFetch(`${cacheKey}-adzuna`, async () => {
          try {
            return await fetchFromAdzuna(query || 'software engineer', 'in', page, {
              location: location || undefined,
              distanceKm: radius ? parseInt(radius) : undefined
            });
          } catch (error) {
            console.warn('⚠️ Adzuna API error:', error);
            return [];
          }
        });
        externalJobs.push(...adzunaJobs);
        console.log(`✅ Adzuna: Found ${adzunaJobs.length} jobs`);

        // Fetch from JSearch with caching
        const jsearchJobs = await getCachedOrFetch(`${cacheKey}-jsearch`, async () => {
          try {
            return await fetchFromJSearch(query || 'software engineer', 'IN', page);
          } catch (error) {
            console.warn('⚠️ JSearch API error:', error);
            return [];
          }
        });
        externalJobs.push(...jsearchJobs);
        console.log(`✅ JSearch: Found ${jsearchJobs.length} jobs`);

        // Fetch from Google Jobs with caching
        const googleJobs = await getCachedOrFetch(`${cacheKey}-google`, async () => {
          try {
            return await fetchFromGoogleJobs(query || 'software engineer', location || 'India', page);
          } catch (error) {
            console.warn('⚠️ Google Jobs API error:', error);
            return [];
          }
        });
        externalJobs.push(...googleJobs);
        console.log(`✅ Google Jobs: Found ${googleJobs.length} jobs`);

        // Fetch from Jooble with caching
        const joobleJobs = await getCachedOrFetch(`${cacheKey}-jooble`, async () => {
          try {
            return await fetchFromJooble(query || 'software engineer', location || 'India', page, {
              radius: radius ? parseInt(radius) : undefined,
              countryCode: country || 'in'
            });
          } catch (error) {
            console.warn('⚠️ Jooble API error:', error);
            return [];
          }
        });
        externalJobs.push(...joobleJobs);
        console.log(`✅ Jooble: Found ${joobleJobs.length} jobs`);

        externalJobsCount = externalJobs.length;
        console.log(`🌐 Total external jobs found: ${externalJobsCount}`);

      } catch (error: any) {
        console.error('❌ External APIs error:', error.message);
        // Continue execution even if external APIs fail
      }
    }

    // Transform external jobs to match frontend expectations
    const transformedExternalJobs = externalJobs.map(job => {
      const transformed = {
        ...job,
        id: `ext-${job.source}-${job.sourceId}`,
        _count: {
          applications: job.applicationsCount || 0,
          bookmarks: 0
        },
        createdAt: job.postedAt || new Date().toISOString(),
        isExternal: true,
        rawData: job.raw
      };
      console.log('🔄 Transformed job:', { id: transformed.id, hasCount: !!transformed._count });
      return transformed;
    });

    // Transform database jobs to match frontend expectations
    const transformedDatabaseJobs = databaseJobs.map(job => {
      const transformed = {
        ...job,
        id: job.id,
        _count: {
          applications: job.applicationsCount || 0,
          bookmarks: 0
        },
        createdAt: job.createdAt,
        isExternal: false,
        source: job.source || 'manual',
        company: job.company || job.companyRelation?.name,
        companyLogo: job.companyLogo || job.companyRelation?.logo,
        companyLocation: job.companyRelation?.location,
        companyIndustry: job.companyRelation?.industry
      };
      console.log('🔄 Transformed database job:', { id: transformed.id, company: transformed.company });
      return transformed;
    });

    // Combine database jobs with sample jobs and external jobs
    console.log(`📊 Job counts: database=${transformedDatabaseJobs.length}, sample=${filteredJobs.length}, external=${externalJobs.length}, transformed=${transformedExternalJobs.length}`);
    const allJobs = [...transformedDatabaseJobs, ...filteredJobs, ...transformedExternalJobs];
    console.log(`📊 Total jobs after combination: ${allJobs.length}`);

    // Apply filters to all jobs (sample + external)
    let finalFilteredJobs = allJobs;

    // Apply query filter
    if (query && query.trim().length > 0) {
      const searchTerm = query.toLowerCase();
      finalFilteredJobs = finalFilteredJobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm) ||
        job.description.toLowerCase().includes(searchTerm) ||
        job.company.toLowerCase().includes(searchTerm) ||
        (job.skills && Array.isArray(job.skills) && job.skills.some((skill: string) => skill.toLowerCase().includes(searchTerm)))
      );
    }

    // Apply location filter
    if (location && location.trim().length > 0) {
      const locationTerm = location.toLowerCase();
      finalFilteredJobs = finalFilteredJobs.filter(job => 
        job.location && job.location.toLowerCase().includes(locationTerm)
      );
    }

    // Apply job type filter
    if (jobType && jobType !== 'all') {
      finalFilteredJobs = finalFilteredJobs.filter(job => job.jobType === jobType);
    }

    // Apply experience level filter
    if (experienceLevel && experienceLevel !== 'all') {
      finalFilteredJobs = finalFilteredJobs.filter(job => job.experienceLevel === experienceLevel);
    }

    // Apply remote filter
    if (isRemote) {
      finalFilteredJobs = finalFilteredJobs.filter(job => job.isRemote === true);
    }

    // Apply salary filters
    if (salaryMin) {
      const minSalary = parseInt(salaryMin);
      finalFilteredJobs = finalFilteredJobs.filter(job => {
        if (job.salaryMin) return job.salaryMin >= minSalary;
        if (job.salary) {
          const salaryMatch = job.salary.match(/₹(\d+),(\d+),(\d+)/);
          if (salaryMatch) {
            const salary = parseInt(salaryMatch[1] + salaryMatch[2] + salaryMatch[3]);
            return salary >= minSalary;
          }
        }
        return true;
      });
    }

    if (salaryMax) {
      const maxSalary = parseInt(salaryMax);
      finalFilteredJobs = finalFilteredJobs.filter(job => {
        if (job.salaryMax) return job.salaryMax <= maxSalary;
        if (job.salary) {
          const salaryMatch = job.salary.match(/₹(\d+),(\d+),(\d+)/);
          if (salaryMatch) {
            const salary = parseInt(salaryMatch[1] + salaryMatch[2] + salaryMatch[3]);
            return salary <= maxSalary;
          }
        }
        return true;
      });
    }

    // Sort jobs (featured first, then by date)
    finalFilteredJobs.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime();
    });

    // Ensure all jobs have the required _count property for frontend compatibility
    const jobsWithCount = finalFilteredJobs.map(job => ({
      ...job,
      _count: job._count || {
        applications: job.applicationsCount || 0,
        bookmarks: 0
      }
    }));

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = jobsWithCount.slice(startIndex, endIndex);

    // Calculate total pages
    const totalPages = Math.ceil(finalFilteredJobs.length / limit);

    console.log(`🎯 Final results: ${paginatedJobs.length} jobs (${databaseJobsCount} database + ${filteredJobs.length} sample + ${externalJobsCount} external)`);
    console.log(`📊 Pagination calculation: ${finalFilteredJobs.length} total jobs, ${limit} per page, ${totalPages} total pages`);
    console.log(`📊 Current page: ${page}, showing jobs ${startIndex + 1} to ${Math.min(endIndex, finalFilteredJobs.length)}`);

    return NextResponse.json({
      success: true,
      jobs: paginatedJobs,
      pagination: {
        page,
        limit,
        total: finalFilteredJobs.length,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      sources: {
        database: true,
        external: true,
        databaseCount: databaseJobsCount,
        sampleCount: filteredJobs.length,
        externalCount: externalJobsCount
      },
      search: {
        query,
        location,
        country,
        source: 'all'
      },
      meta: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/jobs/unified',
        version: '1.0',
        totalJobsFound: finalFilteredJobs.length,
        breakdown: {
          database: databaseJobsCount,
          sample: filteredJobs.length,
          external: externalJobsCount
        }
      }
    });

  } catch (error) {
    console.error('💥 Unified Jobs API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}