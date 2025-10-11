import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchFromAdzuna } from '@/lib/jobs/providers';
import { parseSEOJobUrl } from '@/lib/seo-url-utils';

// Common company relation select for consistency
const COMPANY_RELATION_SELECT = {
  name: true,
  logo: true,
  location: true,
  industry: true,
  website: true
};

/**
 * Find job in database by ID - Enhanced to handle multiple ID formats
 */
async function findJobInDatabase(id: string) {
  try {
    // Try multiple search patterns for maximum compatibility
    const searchConditions = [
      { id: parseInt(id) }, // Direct integer ID
      { sourceId: id }, // Direct sourceId match
    ];

    // For external jobs, also try without source prefix
    if (id.includes('-')) {
      const parts = id.split('-');
      if (parts.length > 1) {
        const sourceId = parts[parts.length - 1]; // Last part is usually the actual ID
        searchConditions.push({ sourceId });
      }
    }

    const job = await prisma.job.findFirst({
      where: {
        OR: searchConditions,
        isActive: true
      },
      include: {
        companyRelation: {
          select: COMPANY_RELATION_SELECT
        }
      }
    });
    return job;
  } catch (error) {
    console.error('Error finding job in database:', error);
    return null;
  }
}

/**
 * Format job response for API
 */
function formatJobResponse(job: any) {
  // Parse skills if they're a string
  const skills = typeof job.skills === 'string' ? JSON.parse(job.skills || '[]') : job.skills;
  
  // Ensure we have all possible URL fields for apply button
  const isManual = job.source === 'manual';
  const baseUrl = job.source_url || job.applyUrl || job.apply_url;
  
  return {
    ...job,
    isExternal: baseUrl ? true : false,
    skills,
    // Ensure all URL fields are populated
    applyUrl: baseUrl || (isManual ? null : ''),
    apply_url: isManual ? `/jobs/${job.id}/apply` : null,
    source_url: !isManual ? baseUrl : null,
    // For backward compatibility
    redirect_url: baseUrl,
    url: baseUrl
  };
}

/**
 * Handle external job lookup
 */
async function handleExternalJob(id: string) {
  const [_, source, sourceId] = id.split('-');
  if (!source || !sourceId) {
    return null;
  }
  
  const externalJob = await fetchExternalJobById(sourceId, source);
  if (externalJob) {
    const jobObject = Array.isArray(externalJob) ? externalJob[0] : externalJob;
    if (jobObject) {
      return formatExternalJob(jobObject, id, source);
    }
  }
  
  return null;
}

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

    // Parse SEO URL to extract actual job ID
    let actualJobId = id;
    if (id.includes('-') && !id.startsWith('sample-')) {
      // This looks like an SEO URL, try to parse it
      const parsedId = parseSEOJobUrl(id);
      if (parsedId) {
        actualJobId = parsedId;
        console.log('✅ Parsed SEO URL:', id, '-> Job ID:', actualJobId);
      } else {
        console.log('⚠️ Could not parse SEO URL, using original ID:', id);
      }
    }

    // Use the parsed job ID for database lookup
    const searchId = actualJobId.trim();
    
    // Try to get job from database first (more efficient)
    let job = await findJobInDatabase(searchId);
    
    if (job) {
      console.log('✅ Job found in database:', job.title);
      return NextResponse.json({ 
        success: true, 
        data: formatJobResponse(job) 
      });
    }
    
    // Check if this is a sample job ID
    if (searchId.startsWith('sample-')) {
      console.log('🔍 Sample job ID detected:', searchId);
      return NextResponse.json({
        success: false,
        error: 'Sample job not found',
        details: 'This is a sample job that cannot be accessed directly. Please search for real jobs.',
        isSample: true
      }, { status: 404 });
    }
    
    // Check if this is a dynamic job ID - try to find it in cache or regenerate
    if (searchId.startsWith('dynamic-')) {
      console.log('🔍 Dynamic job ID detected, attempting to retrieve:', searchId);
      
      // Try to find in database (might have been cached)
      const cachedJob = await prisma.job.findFirst({
        where: {
          sourceId: searchId,
          isActive: true
        }
      });
      
      if (cachedJob) {
        console.log('✅ Found cached dynamic job:', cachedJob.title);
        return NextResponse.json({ 
          success: true, 
          data: formatJobResponse(cachedJob) 
        });
      }
      
      // If not found, return helpful error
      console.log('❌ Dynamic job not found in cache:', searchId);
      return NextResponse.json({
        success: false,
        error: 'Job not available',
        details: 'This job listing is no longer available. It may have expired or been filled. Please search for similar jobs.',
        isDynamic: true,
        suggestion: 'Try searching with relevant keywords to find similar opportunities.'
      }, { status: 410 }); // 410 Gone - resource no longer available
    }
    
    // Check if this is an external job ID
    if (searchId.startsWith('ext-')) {
      const externalJob = await handleExternalJob(searchId);
      if (externalJob) {
        return NextResponse.json({ 
          success: true, 
          data: externalJob 
        });
      }
    }
    
    // Enhanced error response with helpful information
    console.log(`❌ Job not found anywhere: ${searchId}`);
    
    return NextResponse.json({
      success: false,
      error: 'Job not found',
      details: `No job found with ID: ${searchId}. Please check the job ID and try again.`,
      code: 'JOB_NOT_FOUND'
    }, { status: 404 });
    
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
 * Format external job with required fields and proper URLs
 */
function formatExternalJob(job: any, id: string, source: string) {
  // Extract the best available URL from the job data (check all possible fields)
  const bestUrl = job.source_url || job.applyUrl || job.redirect_url || 
                  job.url || job.apply_url || job.link || job.jobUrl || job.job_url;
  
  return {
    ...job,
    id: id,
    isExternal: true,
    source: source,
    // Populate ALL URL fields to ensure apply button works
    applyUrl: bestUrl,
    apply_url: null,                    // External jobs don't have internal apply URL
    source_url: bestUrl,                // External source URL
    redirect_url: bestUrl,              // For backward compatibility
    url: bestUrl,                       // For backward compatibility
    link: bestUrl,                      // For backward compatibility
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
          fetchFromAdzuna(sourceId, 'in', 1, {})
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
      return matchingJob;
    } else {
      console.log(`❌ No matching external job found for sourceId: ${sourceId}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching external job by ID:', error);
    return null;
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
