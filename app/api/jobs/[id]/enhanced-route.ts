import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs } from '@/lib/jobs/providers';
import { EnhancedJobUpsertService } from '@/lib/jobs/enhanced-upsert';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 Enhanced Job API called with ID:', id);
    
    // Add error handling for invalid IDs
    if (!id || typeof id !== 'string') {
      console.error('❌ Invalid job ID provided:', id);
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    // Try to get job from database first (more efficient)
    let job;
    try {
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
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      if (job) {
        console.log('✅ Job found in database:', job.title);
        
        // Check if job is expired
        const isExpired = job.expiryDate && new Date() > job.expiryDate;
        
        if (isExpired) {
          console.log(`⏰ Job is expired: ${job.title}`);
          
          // Get similar jobs for suggestions
          const similarJobs = await EnhancedJobUpsertService.getSimilarJobs(job, 5);
          
          return NextResponse.json({
            success: false,
            error: 'Job Expired',
            details: 'This job has expired. Check similar jobs below 👇',
            expiredJob: {
              ...job,
              isExternal: job.source !== 'manual',
              applyUrl: job.applyUrl || job.apply_url,
              sourceUrl: job.source_url
            },
            similarJobs: similarJobs.map(similarJob => ({
              ...similarJob,
              isExternal: similarJob.source !== 'manual',
              applyUrl: similarJob.applyUrl || similarJob.apply_url,
              sourceUrl: similarJob.source_url
            }))
          }, { status: 410 }); // 410 Gone - resource no longer available
        }
        
        // Job is active, increment view count and return
        await prisma.job.update({
          where: { id },
          data: { views: { increment: 1 } }
        });

        return NextResponse.json({ 
          success: true, 
          data: {
            ...job,
            isExternal: job.source !== 'manual',
            applyUrl: job.applyUrl || job.apply_url,
            sourceUrl: job.source_url
          }
        });
      } else {
        console.log(`❌ Job not found in database: ${id}`);
      }
    } catch (dbError) {
      console.warn('⚠️ Database query failed:', dbError);
    }
    
    // If not found in database, try external APIs as fallback
    console.log('🔍 Trying external APIs as fallback...');
    
    try {
      const externalJob = await fetchExternalJobById(id, 'external');
      
      if (externalJob) {
        console.log(`✅ Found job via external API: ${externalJob.title}`);
        
        // Store the job in database for future requests
        try {
          const storedJob = await prisma.job.create({
            data: {
              source: externalJob.source || 'external',
              sourceId: externalJob.sourceId || id,
              title: externalJob.title,
              company: externalJob.company,
              companyLogo: externalJob.companyLogo,
              location: externalJob.location,
              country: externalJob.country || 'IN',
              description: externalJob.description,
              requirements: externalJob.requirements || '',
              applyUrl: externalJob.applyUrl,
              apply_url: externalJob.apply_url,
              source_url: externalJob.source_url,
              postedAt: externalJob.postedAt ? new Date(externalJob.postedAt) : null,
              expiryDate: externalJob.expiryDate ? new Date(externalJob.expiryDate) : null,
              salary: externalJob.salary,
              salaryMin: externalJob.salaryMin,
              salaryMax: externalJob.salaryMax,
              salaryCurrency: externalJob.salaryCurrency,
              jobType: externalJob.jobType,
              experienceLevel: externalJob.experienceLevel,
              skills: Array.isArray(externalJob.skills) ? externalJob.skills.join(', ') : externalJob.skills || '',
              isRemote: externalJob.isRemote || false,
              isHybrid: externalJob.isHybrid || false,
              isUrgent: externalJob.isUrgent || false,
              isFeatured: externalJob.isFeatured || false,
              sector: externalJob.sector,
              rawJson: externalJob.rawJson || externalJob,
              isActive: true
            }
          });
          
          console.log(`💾 Stored external job in database: ${storedJob.id}`);
          
          return NextResponse.json({
            success: true,
            data: {
              ...storedJob,
              isExternal: true,
              applyUrl: storedJob.applyUrl || storedJob.apply_url,
              sourceUrl: storedJob.source_url
            }
          });
        } catch (storeError) {
          console.warn('⚠️ Failed to store external job:', storeError);
          // Still return the job even if storage failed
          return NextResponse.json({
            success: true,
            data: {
              ...externalJob,
              isExternal: true
            }
          });
        }
      }
    } catch (externalError) {
      console.warn('⚠️ External API fetch failed:', externalError);
    }

    // Job not found anywhere
    console.log(`❌ Job not found: ${id}`);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Job not found',
        details: 'The requested job could not be found in our database or external sources.'
      },
      { status: 404 }
    );

  } catch (error) {
    console.error('❌ Error fetching job details:', error);
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
    const matchingStrategies = [
      (job: any) => job.id === sourceId,
      (job: any) => job.sourceId === sourceId,
      (job: any) => job.externalId === sourceId,
      (job: any) => job.jobId === sourceId,
      (job: any) => job.url && job.url.includes(sourceId),
      (job: any) => job.applyUrl && job.applyUrl.includes(sourceId)
    ];
    
    for (const strategy of matchingStrategies) {
      const foundJob = externalJobs.find(strategy);
      if (foundJob) {
        console.log(`✅ Found job using strategy: ${strategy.name}`);
        return {
          ...foundJob,
          source: foundJob.source || source,
          sourceId: foundJob.sourceId || foundJob.id || sourceId
        };
      }
    }
    
    console.log(`❌ No matching job found for sourceId: ${sourceId}`);
    return null;
    
  } catch (error) {
    console.error('❌ Error in fetchExternalJobById:', error);
    return null;
  }
}
