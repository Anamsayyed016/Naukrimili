
import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs } from '@/lib/jobs/providers';

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
    let limit = 20;
    
    try {
      page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    } catch (parseError) {
      console.warn('⚠️ Parameter parsing error, using defaults:', parseError);
    }
    
    const includeExternal = searchParams.get('includeExternal') === 'true';

    // Sample jobs data for testing
    const sampleJobs = [
      {
        id: '1',
        title: 'Senior Software Engineer',
        company: 'TechCorp India',
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

    // Filter sample jobs based on search criteria
    let filteredJobs = sampleJobs;
    let externalJobs: any[] = [];
    let externalJobsCount = 0;

    // Fetch from external APIs if includeExternal is true
    if (includeExternal) {
      try {
        console.log('🌐 Fetching jobs from external APIs...');
        
        // Fetch from Adzuna
        try {
          const adzunaJobs = await fetchFromAdzuna(query || 'software engineer', 'in', page, {
            location: location || undefined,
            distanceKm: radius ? parseInt(radius) : undefined
          });
          externalJobs.push(...adzunaJobs);
          console.log(`✅ Adzuna: Found ${adzunaJobs.length} jobs`);
        } catch (adzunaError: any) {
          console.warn('⚠️ Adzuna API error:', adzunaError.message);
        }

        // Fetch from JSearch
        try {
          const jsearchJobs = await fetchFromJSearch(query || 'software engineer', 'IN', page);
          externalJobs.push(...jsearchJobs);
          console.log(`✅ JSearch: Found ${jsearchJobs.length} jobs`);
        } catch (jsearchError: any) {
          console.warn('⚠️ JSearch API error:', jsearchError.message);
        }

        // Fetch from Google Jobs
        try {
          const googleJobs = await fetchFromGoogleJobs(query || 'software engineer', location || 'India', page);
          externalJobs.push(...googleJobs);
          console.log(`✅ Google Jobs: Found ${googleJobs.length} jobs`);
        } catch (googleError: any) {
          console.warn('⚠️ Google Jobs API error:', googleError.message);
        }

        externalJobsCount = externalJobs.length;
        console.log(`🌐 Total external jobs found: ${externalJobsCount}`);

      } catch (error: any) {
        console.error('❌ External APIs error:', error.message);
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

    // Combine sample jobs with external jobs
    console.log(`📊 Job counts: sample=${filteredJobs.length}, external=${externalJobs.length}, transformed=${transformedExternalJobs.length}`);
    const allJobs = [...filteredJobs, ...transformedExternalJobs];
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

    console.log(`🎯 Final results: ${paginatedJobs.length} jobs (${filteredJobs.length} sample + ${externalJobsCount} external)`);

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
        databaseCount: filteredJobs.length,
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
          database: filteredJobs.length,
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