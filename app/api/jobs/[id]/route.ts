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
    
    return NextResponse.json({
      success: false,
      error: 'Job not found',
      details: `No job found with ID: ${trimmedId}. Please check the job ID and try again.`,
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
  return {
    ...job,
    id: id,
    isExternal: true,
    source: source,
    apply_url: null,                    // External jobs don't have internal apply URL
    source_url: job.source_url || job.applyUrl || job.redirect_url || job.url, // External source URL
    company: job.company || 'Company not specified',
    location: job.location || 'Location not specified',
    description: job.description || 'No description available',
    skills: Array.isArray(job.skills) ? job.skills : (typeof job.skills === 'string' ? JSON.parse(job.skills || '[]') : []),
    isRemote: job.isRemote || false,
    isFeatured: job.isFeatured || false,
    createdAt: job.postedAt ? new Date(job.postedAt) : new Date(),
    // Ensure we have a valid redirect URL
    redirectUrl: job.source_url || job.applyUrl || job.redirect_url || job.url || '#'
  };
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
