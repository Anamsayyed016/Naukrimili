import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs } from '@/lib/jobs/providers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 Job API called with ID:', id);
    
    // Add error handling for invalid IDs
    if (!id || typeof id !== 'string') {
      console.error('❌ Invalid job ID provided:', id);
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    // First, try to get the job from the unified API (which works without database)
    try {
      console.log('🔍 Fetching job from unified API...');
      const unifiedResponse = await fetch(`${request.nextUrl.origin}/api/jobs/unified?includeExternal=true&limit=1000`);
      
      if (unifiedResponse.ok) {
        const unifiedData = await unifiedResponse.json();
        if (unifiedData.success && unifiedData.jobs) {
          const job = unifiedData.jobs.find((j: any) => j.id === id);
          if (job) {
            console.log('✅ Job found in unified API:', job.title);
            return NextResponse.json({ success: true, job });
          }
        }
      }
    } catch (unifiedError) {
      console.warn('⚠️ Unified API fetch failed, trying database:', unifiedError);
    }
    
    // Check if this is an external job ID first
    if (id.startsWith('ext-')) {
      // Enhanced ID parsing to handle different formats
      let sourceId = '';
      let source = '';
      
      if (id.startsWith('ext-external-')) {
        sourceId = id.replace('ext-external-', '');
        source = 'external';
      } else if (id.startsWith('ext-adzuna-')) {
        sourceId = id.replace('ext-adzuna-', '');
        source = 'adzuna';
      } else if (id.startsWith('ext-jsearch-')) {
        sourceId = id.replace('ext-jsearch-', '');
        source = 'jsearch';
      } else if (id.startsWith('ext-google-')) {
        sourceId = id.replace('ext-google-', '');
        source = 'google';
      } else {
        // Fallback for legacy format
        sourceId = id.replace('ext-', '');
        source = 'external';
      }
      
      console.log(`🔍 Parsed external job ID: source=${source}, sourceId=${sourceId}`);
      
      // Try to find in database first with multiple source variations
      const externalJob = await prisma.job.findFirst({
        where: {
          OR: [
            { source: source, sourceId: sourceId },
            { source: 'external', sourceId: sourceId },
            { source: 'adzuna', sourceId: sourceId },
            { sourceId: sourceId } // Fallback: just match sourceId
          ]
        },
        include: {
          companyRelation: {
            select: {
              name: true,
              logo: true,
              location: true,
              industry: true,
              website: true
            }
          }
        }
      });

      if (externalJob) {
        const formattedJob = {
          ...externalJob,
          company: externalJob.company || externalJob.companyRelation?.name,
          companyLogo: externalJob.companyLogo || externalJob.companyRelation?.logo,
          companyLocation: externalJob.companyRelation?.location,
          companyIndustry: externalJob.companyRelation?.industry,
          companyWebsite: externalJob.companyRelation?.website,
          isExternal: true,
          source: source
        };
        return NextResponse.json({ success: true, job: formattedJob });
      } else {
        // Job not in database, fetch from external API
        console.log(`🔄 Job not in database, fetching from external API: ${id}`);
        
        try {
          // Enhanced external job fetching with better error handling
          console.log(`🔄 Fetching external job from API: source=${source}, sourceId=${sourceId}`);
          
          const externalJobs = await fetchExternalJobById(sourceId, source);
          
          if (externalJobs && externalJobs.length > 0) {
            const job = externalJobs[0];
            const formattedJob = {
              ...job,
              id: id,
              isExternal: true,
              source: source,
              apply_url: null,
              source_url: job.source_url || job.applyUrl || job.redirect_url,
              // Ensure all required fields exist
              company: job.company || 'Company not specified',
              location: job.location || 'Location not specified',
              description: job.description || 'No description available',
              skills: Array.isArray(job.skills) ? job.skills : (typeof job.skills === 'string' ? JSON.parse(job.skills || '[]') : []),
              isRemote: job.isRemote || false,
              isFeatured: job.isFeatured || false,
              createdAt: job.postedAt ? new Date(job.postedAt) : new Date()
            };
            
            console.log(`✅ Successfully fetched external job: ${id}`);
            return NextResponse.json({ success: true, job: formattedJob });
          } else {
            console.log(`❌ External job not found in API: ${id}`);
            return NextResponse.json(
              { success: false, error: 'External job not found' },
              { status: 404 }
            );
          }
        } catch (fetchError) {
          console.error(`❌ Error fetching external job ${id}:`, fetchError);
          return NextResponse.json(
            { success: false, error: 'Failed to fetch external job' },
            { status: 500 }
          );
        }
      }
    }
    
    // Get job details with company information for database IDs
    console.log('🔍 Searching for job in database with ID:', id);
    
    let job;
    try {
    // First, try to get the job from the unified API (which works without database)
    try {
      console.log("🔍 Fetching job from unified API...");
      const unifiedResponse = await fetch("http://localhost:3000/api/jobs/unified?includeExternal=true&limit=1000");
      
      if (unifiedResponse.ok) {
        const unifiedData = await unifiedResponse.json();
        if (unifiedData.success && unifiedData.jobs) {
          const job = unifiedData.jobs.find((j) => j.id === id);
          if (job) {
            console.log("✅ Job found in unified API:", job.title);
            return NextResponse.json({ success: true, job });
          }
        }
      }
    } catch (unifiedError) {
      console.warn("⚠️ Unified API fetch failed, trying database:", unifiedError);
    }

      job = await prisma.job.findUnique({
        where: { id: id },
        include: {
          companyRelation: {
            select: {
              name: true,
              logo: true,
              location: true,
              industry: true,
              website: true
            }
          }
        }
      });
      console.log('🔍 Database query result:', job ? 'Found' : 'Not found');
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }
    
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Format job data
    const formattedJob = {
      ...job,
      company: job.company || job.companyRelation?.name,
      companyLogo: job.companyLogo || job.companyRelation?.logo,
      companyLocation: job.companyRelation?.location,
      companyIndustry: job.companyRelation?.industry,
      companyWebsite: job.companyRelation?.website,
      // Add new fields for internal/external handling
      apply_url: job.apply_url || null,
      source_url: job.source_url || null,
      isExternal: job.source !== 'manual'
    };
    
    return NextResponse.json({
      success: true,
      job: formattedJob
    });
    
  } catch (error) {
    console.error('Error fetching job details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job details' },
      { status: 500 }
    );
  }
}

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
