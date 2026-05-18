
import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs, fetchFromJooble } from '@/lib/jobs/providers';
import { prisma } from '@/lib/prisma';
import { filterValidJobs } from '@/lib/jobs/job-id-validator';
import { upsertNormalizedJob } from '@/lib/jobs/upsertJob';

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
  } catch (_error) {
    console.warn(`⚠️ Failed to fetch ${key}:`, _error);
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
    const countriesParam = searchParams.get('countries'); // comma separated ISO codes
    const countries = (countriesParam ? countriesParam.split(',') : [country])
      .map(c => c.trim().toUpperCase())
      .filter(Boolean);
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
    let days = 30; // freshness window in days
    
    try {
      page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50'))); // Increased max limit
      days = Math.min(180, Math.max(1, parseInt(searchParams.get('days') || '30')));
    } catch (parseError) {
      console.warn('⚠️ Parameter parsing error, using defaults:', parseError);
    }
    
    const includeExternal = searchParams.get('includeExternal') !== 'false';
    const includeSamples = searchParams.get('includeSamples') === 'true';

    // Freshness cutoff
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get the first company ID to link sample jobs to a real company
    let sampleCompanyId = null;
    try {
      const firstCompany = await prisma.company.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true }
      });
      sampleCompanyId = firstCompany?.id || 'sample-company-default';
    } catch (_error) {
      console.log('No company found, using default sample company ID');
      sampleCompanyId = 'sample-company-default';
    }

    // Sample jobs data for testing (disabled unless includeSamples=true)
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
      // EXCLUDE: Sample, dynamic, and seeded jobs - only show professional/real jobs
      const where: any = {
        isActive: true,
        // Exclude unprofessional jobs (sample, dynamic, seeded) - protect employer jobs (source='manual')
        source: {
          notIn: ['sample', 'dynamic', 'seeded']
        }
      };
      
      if (query && query.trim().length > 0) {
        where.OR = [
          { title: { contains: query.trim(), mode: 'insensitive' } },
          { company: { contains: query.trim(), mode: 'insensitive' } },
          { description: { contains: query.trim(), mode: 'insensitive' } }
        ];
      }
      
      // Enhanced dynamic location filtering
      if (location && location.trim().length > 0) {
        const locationParts = location.split(',').map(part => part.trim()).filter(Boolean);
        const locationConditions = locationParts.flatMap(part => [
          { location: { contains: part, mode: 'insensitive' } },
          { country: { contains: part, mode: 'insensitive' } }
        ]);
        
        if (where.OR) {
          // Preserve source filter when adding AND conditions
          if (where.source && !where.AND) {
            where.AND = [{ source: where.source }];
            delete where.source;
          }
          where.AND = [
            ...(where.AND || []),
            { OR: where.OR },
            { OR: locationConditions }
          ];
          delete where.OR;
        } else {
          where.OR = locationConditions;
        }
      }
      
      // Ensure source filter is in AND if AND exists
      if (where.AND && where.source) {
        where.AND.push({ source: where.source });
        delete where.source;
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
          },
          _count: {
            select: {
              applications: true,
              bookmarks: true
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
    let filteredJobs = includeSamples ? sampleJobs : [];
    let externalJobs: any[] = [];
    let externalJobsCount = 0;

    // Fetch from external APIs if includeExternal is true
    if (includeExternal !== false) {
      try {
        console.log('🌐 Fetching jobs from external APIs...');
        
        // Create cache key based on search parameters
        const cacheKey = `external-${query}-${location}-${country}-${page}`;
        
        // Fetch from Adzuna with caching
        const adzunaJobs = await getCachedOrFetch(`${cacheKey}-adzuna`, async () => {
          try {
            // Use first requested country for provider code (adzuna expects lowercase two-letter)
            const adzCountry = (countries[0] || 'IN').toLowerCase();
            return await fetchFromAdzuna(query || 'software engineer', adzCountry, page, {
              location: location || undefined,
              distanceKm: radius ? parseInt(radius) : undefined
            });
          } catch (_error) {
            console.warn('⚠️ Adzuna API error:', _error);
            return [];
          }
        });
        externalJobs.push(...adzunaJobs);
        console.log(`✅ Adzuna: Found ${adzunaJobs.length} jobs`);

        // Fetch from JSearch with caching
        const jsearchJobs = await getCachedOrFetch(`${cacheKey}-jsearch`, async () => {
          try {
            return await fetchFromJSearch(query || 'software engineer', (countries[0] || 'IN'), page);
          } catch (_error) {
            console.warn('⚠️ JSearch API error:', _error);
            return [];
          }
        });
        externalJobs.push(...jsearchJobs);
        console.log(`✅ JSearch: Found ${jsearchJobs.length} jobs`);

        // Fetch from Google Jobs with caching
        const googleJobs = await getCachedOrFetch(`${cacheKey}-google`, async () => {
          try {
            // Use location text if provided; otherwise fallback to country name
            const locText = location || (countries[0] === 'US' ? 'United States' : countries[0] === 'GB' ? 'United Kingdom' : 'India');
            return await fetchFromGoogleJobs(query || 'software engineer', locText, page);
          } catch (_error) {
            console.warn('⚠️ Google Jobs API error:', _error);
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
              countryCode: (countries[0] || country || 'IN')
            });
          } catch (_error) {
            console.warn('⚠️ Jooble API error:', _error);
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
    const transformedExternalJobs = externalJobs
      .filter(job => {
        // Validate job has sourceId
        if (!job.sourceId) {
          console.error('❌ External job missing sourceId, skipping:', { title: job.title, company: job.company, source: job.source });
          return false;
        }
        return true;
      })
      .map(job => {
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
        console.log('🔄 Transformed external job:', { id: transformed.id, sourceId: job.sourceId, hasCount: !!transformed._count });
        return transformed;
      });

    // Persist external jobs so detail pages can load them from the database
    if (transformedExternalJobs.length > 0) {
      await Promise.all(
        transformedExternalJobs.map((job) =>
          upsertNormalizedJob({
            source: job.source,
            sourceId: String(job.sourceId),
            title: job.title,
            company: job.company,
            location: job.location,
            country: job.country,
            description: job.description,
            requirements: job.requirements,
            applyUrl: job.applyUrl || job.source_url,
            apply_url: job.apply_url,
            source_url: job.source_url || job.applyUrl,
            postedAt: job.postedAt,
            salary: job.salary,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            salaryCurrency: job.salaryCurrency,
            jobType: job.jobType,
            experienceLevel: job.experienceLevel,
            skills: job.skills,
            isRemote: job.isRemote,
            isHybrid: job.isHybrid,
            sector: job.sector,
          }).catch(() => null)
        )
      );
    }

    // Transform database jobs to match frontend expectations
    const transformedDatabaseJobs = databaseJobs
      .filter(job => {
        // Validate job has ID
        if (!job.id) {
          console.error('❌ Database job missing ID, skipping:', { title: job.title, company: job.company });
          return false;
        }
        // EXCLUDE: Filter out sample/dynamic/seeded jobs (should already be filtered by database query, but double-check)
        if (job.source === 'sample' || job.source === 'dynamic' || job.source === 'seeded') {
          return false;
        }
        return true;
      })
      .map(job => {
        const transformed = {
          ...job,
          id: job.id,
          _count: {
            applications: job._count?.applications || 0,
            bookmarks: job._count?.bookmarks || 0
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
    // Merge then enforce country allowlist and freshness, and de-duplicate
    const requestedCountries = new Set(countries);
    const allJobs = filterValidJobs([...transformedDatabaseJobs, ...filteredJobs, ...transformedExternalJobs])
      .filter(job => {
        const jobCountry = (job.country || '').toString().toUpperCase();
        return requestedCountries.has(jobCountry);
      })
      .filter(job => {
        const d = new Date(job.postedAt || job.createdAt || 0);
        return isFinite(d.getTime()) && d >= cutoff;
      });

    // IMPROVED DEDUPLICATION: Prioritize employer/manual jobs over external jobs
    const seen = new Map<string, any>(); // Use Map to track best job for each key
    const sourcePriority = (source: string): number => {
      if (source === 'manual' || source === 'employer') return 3;
      if (source === 'database') return 2;
      return 1; // external sources
    };
    
    for (const j of allJobs) {
      // Skip sample/dynamic/seeded jobs
      if (j.source === 'sample' || j.source === 'dynamic' || j.source === 'seeded') {
        continue;
      }
      
      // Create normalized key for duplicate detection
      const title = (j.title || '').trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
      const company = (j.company || '').trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
      const location = (j.location || '').trim().toLowerCase().split(',')[0].replace(/[^a-z0-9\s]/g, '');
      const key = `${title}|${company}|${location}`;
      
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, j);
      } else {
        // Keep job with higher source priority
        const existingPriority = sourcePriority(existing.source || 'external');
        const currentPriority = sourcePriority(j.source || 'external');
        if (currentPriority > existingPriority) {
          seen.set(key, j);
        }
      }
    }
    
    const uniqueJobs = Array.from(seen.values());
    console.log(`📊 Deduplication: ${allJobs.length} jobs → ${uniqueJobs.length} unique jobs`);

    // QUALITY FILTER: Remove unprofessional jobs with generic descriptions
    const professionalJobs = uniqueJobs.filter(job => {
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
    
    if (uniqueJobs.length !== professionalJobs.length) {
      console.log(`🔄 Quality filter: Removed ${uniqueJobs.length - professionalJobs.length} unprofessional jobs`);
    }
    
    // Apply filters to all jobs (sample + external)
    let finalFilteredJobs = professionalJobs;

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
    }, { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=600' } });

  } catch (_error) {
    console.error('💥 Unified Jobs API Error:', _error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: _error instanceof Error ? _error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}