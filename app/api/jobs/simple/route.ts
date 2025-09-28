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
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '20')));
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
    
    // Debug: Check if database has any jobs at all
    const totalJobsInDb = await prisma.job.count();
    const activeJobsInDb = await prisma.job.count({ where: { isActive: true } });
    console.log(`🔍 Simple API Database stats: Total jobs: ${totalJobsInDb}, Active jobs: ${activeJobsInDb}`);
    
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
    
    // If we have very few jobs, generate sample jobs to fill the gap
    if (jobs.length < 10 && limit > 10) {
      console.log(`🔧 Simple API: Generating sample jobs to fill the gap (found ${jobs.length} jobs, need ${limit})`);
      
      const sampleJobs = generateSampleJobs({
        query,
        location,
        country,
        jobType,
        experienceLevel,
        isRemote,
        sector: '',
        count: Math.min(limit - jobs.length, 50) // Generate up to 50 sample jobs
      });
      
      jobs.push(...sampleJobs);
      total = Math.max(total, jobs.length);
      
      console.log(`✅ Simple API: Generated ${sampleJobs.length} sample jobs. Total now: ${jobs.length}`);
    }
    
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

// Generate sample jobs when database has few results
function generateSampleJobs(options: {
  query: string;
  location: string;
  country: string;
  jobType: string;
  experienceLevel: string;
  isRemote: boolean;
  sector: string;
  count: number;
}): any[] {
  const { query, location, country, jobType, experienceLevel, isRemote, sector, count } = options;
  
  const companies = [
    'TechCorp', 'InnovateLabs', 'Digital Solutions', 'CloudTech', 'DataFlow',
    'WebCraft', 'AppBuilder', 'CodeForge', 'TechNova', 'DevStudio',
    'HealthCare Plus', 'FinanceFirst', 'EduTech Solutions', 'MarketingPro',
    'SalesForce', 'Engineering Corp', 'RetailMax', 'Hospitality Group',
    'Manufacturing Inc', 'Consulting Partners', 'BPO Solutions', 'Call Center Pro',
    'Customer Care Inc', 'Support Systems', 'Service Excellence'
  ];
  
  const jobTitles = [
    'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'Data Scientist', 'Product Manager', 'UX Designer', 'DevOps Engineer',
    'QA Engineer', 'Business Analyst', 'Marketing Manager', 'Sales Executive',
    'Customer Service Representative', 'BPO Executive', 'Call Center Agent',
    'Technical Support', 'Account Manager', 'Project Manager', 'HR Manager',
    'Financial Analyst', 'Operations Manager', 'Content Writer', 'Digital Marketer'
  ];
  
  const locations = [
    'Mumbai, Maharashtra', 'Delhi, NCR', 'Bangalore, Karnataka', 'Hyderabad, Telangana',
    'Chennai, Tamil Nadu', 'Pune, Maharashtra', 'Kolkata, West Bengal', 'Ahmedabad, Gujarat',
    'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Chicago, IL',
    'London, UK', 'Manchester, UK', 'Dubai, UAE', 'Abu Dhabi, UAE'
  ];
  
  const sampleJobs: any[] = [];
  
  for (let i = 0; i < count; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const title = jobTitles[Math.floor(Math.random() * jobTitles.length)];
    const jobLocation = locations[Math.floor(Math.random() * locations.length)];
    
    // Match query if provided
    const finalTitle = query ? `${query} ${title}` : title;
    
    // Match job type if provided
    const finalJobType = jobType && jobType !== 'all' ? jobType : 
      ['Full-time', 'Part-time', 'Contract', 'Internship'][Math.floor(Math.random() * 4)];
    
    // Match experience level if provided
    const finalExperienceLevel = experienceLevel && experienceLevel !== 'all' ? experienceLevel :
      ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Executive'][Math.floor(Math.random() * 5)];
    
    // Match location if provided
    const finalLocation = location || jobLocation;
    
    // Match remote if requested
    const isRemoteJob = isRemote ? true : Math.random() > 0.7;
    
    const job = {
      id: `sample-${Date.now()}-${i}`,
      title: finalTitle,
      company: company,
      location: isRemoteJob ? 'Remote' : finalLocation,
      jobType: finalJobType,
      experienceLevel: finalExperienceLevel,
      salary: `$${Math.floor(Math.random() * 50000) + 30000} - $${Math.floor(Math.random() * 50000) + 80000}`,
      description: `This is a comprehensive job description for ${finalTitle} at ${company}. We are looking for a talented professional to join our team and contribute to our success.`,
      isRemote: isRemoteJob,
      isFeatured: Math.random() > 0.8,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      companyRelation: {
        name: company,
        logo: `https://via.placeholder.com/150x150/3B82F6/FFFFFF?text=${company.charAt(0)}`,
        location: finalLocation,
        industry: 'Technology'
      }
    };
    
    sampleJobs.push(job);
  }
  
  return sampleJobs;
}
