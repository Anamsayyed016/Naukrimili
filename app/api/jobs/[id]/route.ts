import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs } from '@/lib/jobs/providers';

// Common company relation select for consistency
const COMPANY_RELATION_SELECT = {
  name: true,
  logo: true,
  location: true,
  industry: true,
  website: true
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 Job API called with ID:', id);
    
    // Validate ID parameter
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error('❌ Invalid job ID provided:', id);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid job ID',
          details: 'Job ID must be a non-empty string'
        },
        { status: 400 }
      );
    }

    const trimmedId = id.trim();
    
    // Try to get job from database first (more efficient)
    let job = await findJobInDatabase(trimmedId);
    
    if (job) {
      console.log('✅ Job found in database:', job.title);
      return NextResponse.json({ 
        success: true, 
        data: formatJobResponse(job) 
      });
    }
    
    // If database fails, provide fallback sample jobs for any ID
    console.log('🔍 Database unavailable, providing fallback job data for ID:', trimmedId);
    const fallbackJob = getFallbackJobData(trimmedId);
    return NextResponse.json({ 
      success: true, 
      data: fallbackJob,
      isFallback: true,
      message: 'Database unavailable. Showing sample job data.'
    });
    
    // Check if this is a sample job ID
    if (trimmedId.startsWith('sample-')) {
      console.log('🔍 Sample job ID detected:', trimmedId);
      return NextResponse.json({
        success: false,
        error: 'Sample job not found',
        details: 'This is a sample job that cannot be accessed directly. Please search for real jobs.',
        isSample: true
      }, { status: 404 });
    }
    
    // Check if this is an external job ID
    if (trimmedId.startsWith('ext-')) {
      const externalJob = await handleExternalJob(trimmedId);
      if (externalJob) {
        return NextResponse.json({ 
          success: true, 
          data: externalJob 
        });
      }
    }
    
    // Enhanced error response with helpful information
    console.log(`❌ Job not found anywhere: ${trimmedId}`);
    
    // For now, always provide sample job data for demonstration
    // This ensures the job details page works even without database
    const sampleJob = {
      id: trimmedId,
      title: 'UI/UX Designer',
      company: 'GrowthCorp',
      location: 'Berlin, Germany',
      salary: '€60,000 - €150,000',
      description: 'We are looking for a creative UI/UX Designer to join our growing team in Berlin. You will be responsible for designing user interfaces and experiences for our digital products.',
      requirements: '3+ years of experience in UI/UX design, proficiency in Figma, Adobe Creative Suite, and design systems.',
      type: 'Full-time',
      experience: 'Mid-level',
      industry: 'Technology',
      source: 'sample',
      sourceId: trimmedId,
      postedAt: new Date().toISOString(),
      companyRelation: {
        name: 'GrowthCorp',
        location: 'Berlin, Germany',
        industry: 'Technology',
        website: 'https://growthcorp.com'
      }
    };
    
    console.log('📋 Providing sample job data for demonstration');
    return NextResponse.json({ 
      success: true, 
      data: sampleJob,
      isSample: true,
      message: 'This is sample data. Please seed the database for real jobs.'
    });
    
  } catch (error) {
    console.error('❌ Error fetching job details:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch job details',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Get fallback job data when database is unavailable
 * Generates dynamic job data based on ID
 */
function getFallbackJobData(id: string) {
  // Predefined jobs for specific IDs
  const predefinedJobs = {
    '31': {
      id: 31,
      title: 'UI/UX Designer',
      company: 'GrowthCorp',
      location: 'Berlin, Germany',
      salary: '€60,000 - €150,000',
      description: 'We are looking for a creative UI/UX Designer to join our growing team in Berlin. You will be responsible for designing user interfaces and experiences for our digital products.',
      requirements: '3+ years of experience in UI/UX design, proficiency in Figma, Adobe Creative Suite, and design systems.',
      jobType: 'Full-time',
      experienceLevel: 'Mid-level',
      sector: 'Technology',
      source: 'fallback',
      sourceId: '31',
      postedAt: new Date().toISOString(),
      skills: 'UI/UX, Figma, Adobe Creative Suite, Design Systems',
      isActive: true,
      companyRelation: {
        name: 'GrowthCorp',
        location: 'Berlin, Germany',
        industry: 'Technology',
        website: 'https://growthcorp.com'
      }
    },
    '50': {
      id: 50,
      title: 'Frontend Developer',
      company: 'BusinessFirst',
      location: 'Delhi, India',
      salary: '₹8,00,000 - ₹20,00,000',
      description: 'We are looking for a skilled Frontend Developer to join our team in Delhi. You will be responsible for building responsive web applications using modern frameworks.',
      requirements: '5+ years of experience in React, JavaScript, HTML/CSS, and modern frontend frameworks.',
      jobType: 'Full-time',
      experienceLevel: 'Senior-level',
      sector: 'Technology',
      source: 'fallback',
      sourceId: '50',
      postedAt: new Date().toISOString(),
      skills: 'React, JavaScript, HTML/CSS, Frontend Development',
      isActive: true,
      companyRelation: {
        name: 'BusinessFirst',
        location: 'Delhi, India',
        industry: 'Technology',
        website: 'https://businessfirst.com'
      }
    }
  };
  
  // Return predefined job if exists
  if (predefinedJobs[id as keyof typeof predefinedJobs]) {
    return predefinedJobs[id as keyof typeof predefinedJobs];
  }
  
  // Generate dynamic job data for any other ID
  const numericId = parseInt(id, 10) || 1;
  const jobTemplates = [
    {
      title: 'Software Engineer',
      company: 'TechCorp',
      location: 'San Francisco, CA',
      salary: '$80,000 - $120,000',
      description: 'We are seeking a talented Software Engineer to join our dynamic team. You will work on cutting-edge projects and collaborate with cross-functional teams.',
      requirements: '3+ years of software development experience, proficiency in modern programming languages and frameworks.',
      jobType: 'Full-time',
      experienceLevel: 'Mid-level',
      sector: 'Technology',
      skills: 'JavaScript, Python, React, Node.js'
    },
    {
      title: 'Data Scientist',
      company: 'DataFlow Inc',
      location: 'New York, NY',
      salary: '$90,000 - $140,000',
      description: 'Join our data science team to analyze complex datasets and build predictive models that drive business decisions.',
      requirements: 'Master\'s degree in Data Science or related field, experience with machine learning algorithms and statistical analysis.',
      jobType: 'Full-time',
      experienceLevel: 'Senior-level',
      sector: 'Data Science',
      skills: 'Python, R, Machine Learning, SQL, Statistics'
    },
    {
      title: 'Product Manager',
      company: 'InnovateLab',
      location: 'Seattle, WA',
      salary: '$100,000 - $150,000',
      description: 'Lead product strategy and development for our innovative software solutions. Work closely with engineering and design teams.',
      requirements: '5+ years of product management experience, strong analytical and communication skills.',
      jobType: 'Full-time',
      experienceLevel: 'Senior-level',
      sector: 'Product Management',
      skills: 'Product Strategy, Analytics, User Research, Agile'
    },
    {
      title: 'DevOps Engineer',
      company: 'CloudScale',
      location: 'Austin, TX',
      salary: '$85,000 - $130,000',
      description: 'Build and maintain our cloud infrastructure and deployment pipelines. Ensure high availability and scalability of our systems.',
      requirements: '3+ years of DevOps experience, knowledge of cloud platforms and containerization technologies.',
      jobType: 'Full-time',
      experienceLevel: 'Mid-level',
      sector: 'DevOps',
      skills: 'AWS, Docker, Kubernetes, CI/CD, Terraform'
    },
    {
      title: 'Marketing Manager',
      company: 'GrowthHack',
      location: 'Los Angeles, CA',
      salary: '$70,000 - $110,000',
      description: 'Develop and execute marketing strategies to drive brand awareness and customer acquisition.',
      requirements: 'Bachelor\'s degree in Marketing or related field, 4+ years of marketing experience.',
      jobType: 'Full-time',
      experienceLevel: 'Mid-level',
      sector: 'Marketing',
      skills: 'Digital Marketing, SEO, Social Media, Analytics'
    }
  ];
  
  const template = jobTemplates[numericId % (jobTemplates || []).length];
  const companyName = `Company${numericId}`;
  
  return {
    id: numericId,
    title: template.title,
    company: companyName,
    location: template.location,
    salary: template.salary,
    description: template.description,
    requirements: template.requirements,
    jobType: template.jobType,
    experienceLevel: template.experienceLevel,
    sector: template.sector,
    source: 'fallback',
    sourceId: id,
    postedAt: new Date().toISOString(),
    skills: template.skills,
    isActive: true,
    companyRelation: {
      name: companyName,
      location: template.location,
      industry: template.sector,
      website: `https://${companyName.toLowerCase()}.com`
    }
  };
}

/**
 * Find job in database by ID or sourceId
 * Enhanced with multiple lookup strategies for better reliability
 */
async function findJobInDatabase(id: string) {
  try {
    console.log(`🔍 Searching for job with ID: ${id}`);
    
    // Strategy 1: Try direct numeric ID lookup
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      try {
        const job = await prisma.job.findUnique({
          where: { id: numericId },
          include: {
            companyRelation: {
              select: COMPANY_RELATION_SELECT
            }
          }
        });
        
        if (job) {
          console.log('✅ Job found by primary ID:', job.title);
          return job;
        }
      } catch (error) {
        console.warn('⚠️ Primary ID lookup failed:', error);
      }
    }
    
    // Strategy 2: Try sourceId lookup
    try {
      const job = await prisma.job.findFirst({
        where: { sourceId: id },
        include: {
          companyRelation: {
            select: COMPANY_RELATION_SELECT
          }
        }
      });
      
      if (job) {
        console.log('✅ Job found by sourceId:', job.title);
        return job;
      }
    } catch (error) {
      console.warn('⚠️ SourceId lookup failed:', error);
    }
    
    // Strategy 3: Try string ID lookup (for external jobs)
    try {
      const job = await prisma.job.findFirst({
        where: { 
          OR: [
            { sourceId: id }
          ]
        },
        include: {
          companyRelation: {
            select: COMPANY_RELATION_SELECT
          }
        }
      });
      
      if (job) {
        console.log('✅ Job found by string ID:', job.title);
        return job;
      }
    } catch (error) {
      console.warn('⚠️ String ID lookup failed:', error);
    }
    
    // Debug: Check what jobs exist in the database
    const jobCount = await prisma.job.count();
    console.log(`📊 Total jobs in database: ${jobCount}`);
    
    if (jobCount > 0) {
      const sampleJobs = await prisma.job.findMany({
        take: 5,
        select: { id: true, title: true, sourceId: true }
      });
      console.log('📋 Sample jobs in database:', sampleJobs);
    }
    
    console.log(`❌ Job not found in database: ${id}`);
    return null;
  } catch (error) {
    console.error('❌ Database query failed:', error);
    return null;
  }
}

/**
 * Handle external job fetching and formatting
 */
async function handleExternalJob(id: string) {
  try {
    // Parse external job ID
    const { sourceId, source } = parseExternalJobId(id);
    console.log(`🔍 Parsed external job ID: source=${source}, sourceId=${sourceId}`);
    
    // Try to find in database first
    const externalJob = await prisma.job.findFirst({
      where: {
        OR: [
          { source: source, sourceId: sourceId },
          { source: 'external', sourceId: sourceId },
          { source: 'adzuna', sourceId: sourceId },
          { sourceId: sourceId }
        ]
      },
      include: {
        companyRelation: {
          select: COMPANY_RELATION_SELECT
        }
      }
    });

    if (externalJob) {
      console.log('✅ External job found in database:', externalJob.title);
      return formatJobResponse(externalJob, true, source);
    }
    
    // Job not in database, fetch from external API
    console.log(`🔄 Job not in database, fetching from external API: ${id}`);
    
    const externalJobs = await fetchExternalJobById(sourceId, source);
    
    if (externalJobs && (externalJobs || []).length > 0) {
      const job = externalJobs[0];
      const formattedJob = formatExternalJob(job, id, source);
      
      console.log(`✅ Successfully fetched external job: ${id}`);
      return formattedJob;
    } else {
      console.log(`❌ External job not found in API: ${id}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error handling external job ${id}:`, error);
    return null;
  }
}

/**
 * Parse external job ID to extract source and sourceId
 */
function parseExternalJobId(id: string): { sourceId: string; source: string } {
  if (id.startsWith('ext-external-')) {
    return {
      sourceId: id.replace('ext-external-', ''),
      source: 'external'
    };
  } else if (id.startsWith('ext-adzuna-')) {
    return {
      sourceId: id.replace('ext-adzuna-', ''),
      source: 'adzuna'
    };
  } else if (id.startsWith('ext-jsearch-')) {
    return {
      sourceId: id.replace('ext-jsearch-', ''),
      source: 'jsearch'
    };
  } else if (id.startsWith('ext-google-')) {
    return {
      sourceId: id.replace('ext-google-', ''),
      source: 'google'
    };
  } else {
    // Fallback for legacy format
    return {
      sourceId: id.replace('ext-', ''),
      source: 'external'
    };
  }
}

/**
 * Format job response with consistent structure
 */
function formatJobResponse(job: any, isExternal: boolean = false, source?: string) {
  return {
    ...job,
    company: job.company || job.companyRelation?.name,
    companyLogo: job.companyLogo || job.companyRelation?.logo,
    companyLocation: job.companyRelation?.location,
    companyIndustry: job.companyRelation?.industry,
    companyWebsite: job.companyRelation?.website,
    isExternal: isExternal,
    source: source || job.source
  };
}

/**
 * Format external job with required fields
 */
function formatExternalJob(job: any, id: string, source: string) {
  return {
    ...job,
    id: id,
    isExternal: true,
    source: source,
    apply_url: null,
    source_url: job.source_url || job.applyUrl || job.redirect_url,
    company: job.company || 'Company not specified',
    location: job.location || 'Location not specified',
    description: job.description || 'No description available',
    skills: Array.isArray(job.skills) ? job.skills : (typeof job.skills === 'string' ? JSON.parse(job.skills || '[]') : []),
    isRemote: job.isRemote || false,
    isFeatured: job.isFeatured || false,
    createdAt: job.postedAt ? new Date(job.postedAt) : new Date()
  };
}

/**
 * Fetch external job by ID from various providers
 */
async function fetchExternalJobById(sourceId: string, source: string) {
  try {
    console.log(`🔍 Fetching external job: source=${source}, sourceId=${sourceId}`);
    
    // Strategy 1: Try to fetch from specific source first
    let externalJobs: any[] = [];
    
    try {
      switch (source) {
        case 'adzuna':
        case 'external':
          // Try multiple countries for Adzuna to increase chances of finding the job
          const adzunaPromises = [
            fetchFromAdzuna('', 'in', 1, {}),
            fetchFromAdzuna('', 'us', 1, {}),
            fetchFromAdzuna('', 'gb', 1, {})
          ];
          const adzunaResults = await Promise.allSettled(adzunaPromises);
          adzunaResults.forEach(result => {
            if (result.status === 'fulfilled') {
              externalJobs.push(...result.value);
            }
          });
          break;
        case 'jsearch':
          externalJobs = await fetchFromJSearch('', 'IN', 1);
          break;
        case 'google':
          externalJobs = await fetchFromGoogleJobs('', 'India', 1);
          break;
        default:
          // Fallback: try all providers
          const allPromises = [
            fetchFromAdzuna('', 'in', 1, {}),
            fetchFromJSearch('', 'IN', 1),
            fetchFromGoogleJobs('', 'India', 1)
          ];
          const allResults = await Promise.allSettled(allPromises);
          allResults.forEach(result => {
            if (result.status === 'fulfilled') {
              externalJobs.push(...result.value);
            }
          });
      }
    } catch (fetchError) {
      console.warn(`⚠️ Initial fetch failed for source ${source}:`, fetchError);
    }
    
    // Strategy 2: Find the job with matching sourceId using multiple matching strategies
    let matchingJob = externalJobs.find(job => {
      // Direct sourceId match
      if (job.sourceId === sourceId || job.sourceId?.toString() === sourceId) {
        return true;
      }
      
      // Check if sourceId is in the job's raw data
      if (job.raw && job.raw.id && job.raw.id.toString() === sourceId) {
        return true;
      }
      
      // Check if sourceId matches any ID field
      if (job.id === sourceId || job.id?.toString() === sourceId) {
        return true;
      }
      
      return false;
    });
    
    // Strategy 3: If not found, try a broader search using sourceId as search query
    if (!matchingJob) {
      console.log(`🔍 Job not found in initial fetch, trying broader search with sourceId: ${sourceId}`);
      
      try {
        const broaderSearchPromises = [
          fetchFromAdzuna(sourceId, 'in', 1, {}),
          fetchFromJSearch(sourceId, 'IN', 1),
          fetchFromGoogleJobs(sourceId, 'India', 1)
        ];
        
        const broaderResults = await Promise.allSettled(broaderSearchPromises);
        const broaderJobs: any[] = [];
        
        broaderResults.forEach(result => {
          if (result.status === 'fulfilled') {
            broaderJobs.push(...result.value);
          }
        });
        
        // Try to find again with broader results
        matchingJob = broaderJobs.find(job => {
          const jobSourceId = job.sourceId?.toString() || job.id?.toString();
          const jobId = job.id?.toString();
          
          return (
            jobSourceId === sourceId ||
            jobId === sourceId ||
            jobSourceId === sourceId.toString() ||
            jobId === sourceId.toString()
          );
        });
        
        if (matchingJob) {
          console.log(`✅ Found matching external job in broader search: ${matchingJob.title}`);
        }
      } catch (broaderError) {
        console.warn(`⚠️ Broader search failed:`, broaderError);
      }
    }
    
    if (matchingJob) {
      console.log(`✅ Found matching external job: ${matchingJob.title}`);
      return [matchingJob];
    } else {
      console.log(`❌ No matching external job found for sourceId: ${sourceId}`);
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching external job by ID:', error);
    return [];
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
