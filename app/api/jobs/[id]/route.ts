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
    
    // Check if this is an external job ID first
    if (id.startsWith('ext-')) {
      // Try to find in database first
      const sourceId = id.replace('ext-external-', '').replace('ext-', '');
      const source = id.includes('external') ? 'external' : 'adzuna';
      
      const externalJob = await prisma.job.findFirst({
        where: {
          source: source,
          sourceId: sourceId
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
          // Extract source and sourceId from the ID
          let actualSourceId = sourceId;
          let actualSource = 'adzuna'; // default
          
          if (id.includes('external')) {
            actualSource = 'adzuna';
            actualSourceId = id.replace('ext-external-', '');
          } else if (id.includes('jsearch')) {
            actualSource = 'jsearch';
            actualSourceId = id.replace('ext-jsearch-', '');
          } else if (id.includes('google')) {
            actualSource = 'google';
            actualSourceId = id.replace('ext-google-', '');
          }
          
          // Fetch from external APIs
          const externalJobs = await fetchExternalJobById(actualSourceId, actualSource);
          
          if (externalJobs && externalJobs.length > 0) {
            const job = externalJobs[0];
            const formattedJob = {
              ...job,
              id: id,
              isExternal: true,
              source: actualSource,
              apply_url: null,
              source_url: job.source_url || job.applyUrl
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
    const job = await prisma.job.findUnique({
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
    // For now, we'll fetch from all providers and find the matching job
    // This is not ideal but works for the current setup
    const allExternalJobs: any[] = [];
    
    const fetchPromises = [
      fetchFromAdzuna('', 'in', 1, {}),
      fetchFromJSearch('', 'IN', 1),
      fetchFromGoogleJobs('', 'India', 1)
    ];
    
    const results = await Promise.allSettled(fetchPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allExternalJobs.push(...result.value);
      }
    });
    
    // Find the job with matching sourceId
    const matchingJob = allExternalJobs.find(job => 
      job.sourceId === sourceId || 
      job.id === sourceId ||
      job.sourceId?.toString() === sourceId
    );
    
    return matchingJob ? [matchingJob] : [];
  } catch (error) {
    console.error('Error fetching external job by ID:', error);
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
