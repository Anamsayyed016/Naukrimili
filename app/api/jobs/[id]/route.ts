import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log(`🔍 Job Detail API: Fetching job with ID: ${id}`);
    
    // Check if this is an external job ID (starts with 'ext-')
    if (id.startsWith('ext-')) {
<<<<<<< HEAD
      // For external jobs, fetch from unified API
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/jobs/unified?limit=100&includeExternal=true`, {
          next: { revalidate: 60 }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch from unified API');
        }
        
        const data = await response.json();
        if (data.success && data.jobs) {
          // Find the specific external job by ID
          const externalJob = data.jobs.find((job: any) => job.id === id);
          
          if (externalJob) {
            console.log(`✅ Found external job: ${externalJob.title}`);
            
            // Format external job data to match expected structure
            const formattedJob = {
              id: externalJob.id,
              title: externalJob.title,
              company: externalJob.company,
              companyLogo: null,
              location: externalJob.location,
              country: externalJob.country,
              description: externalJob.description,
              requirements: externalJob.requirements || '',
              applyUrl: externalJob.applyUrl || externalJob.apply_url,
              apply_url: externalJob.apply_url,
              source_url: externalJob.source_url,
              postedAt: externalJob.postedAt,
              salary: externalJob.salary,
              salaryMin: externalJob.salaryMin,
              salaryMax: externalJob.salaryMax,
              salaryCurrency: externalJob.salaryCurrency,
              jobType: externalJob.jobType,
              experienceLevel: externalJob.experienceLevel,
              skills: externalJob.skills || [],
              isRemote: externalJob.isRemote || false,
              isHybrid: externalJob.isHybrid || false,
              isUrgent: externalJob.isUrgent || false,
              isFeatured: externalJob.isFeatured || false,
              isActive: externalJob.isActive !== false,
              sector: externalJob.sector,
              views: externalJob.views || 0,
              applications: externalJob.applicationsCount || 0,
              applicationsCount: externalJob.applicationsCount || 0,
              createdAt: externalJob.createdAt,
              updatedAt: new Date().toISOString(),
              source: externalJob.source || 'external',
              isExternal: true,
              companyRelation: {
                name: externalJob.company,
                logo: null,
                location: externalJob.location,
                industry: externalJob.sector,
                website: null
              }
            };
            
            return NextResponse.json({
              success: true,
              job: formattedJob
            });
          } else {
            console.log(`❌ External job not found: ${id}`);
            return NextResponse.json(
              { success: false, error: 'External job not found' },
              { status: 404 }
            );
          }
        } else {
          throw new Error('Invalid response from unified API');
        }
      } catch (unifiedError) {
        console.error('❌ Error fetching from unified API:', unifiedError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch external job details' },
          { status: 500 }
        );
=======
        const sourceId = id.replace('ext-external-', '').replace('ext-', '');

        const externalJob = await prisma.job.findFirst({
          where: {
            source: 'external',
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
            source: "external"
          };
          return NextResponse.json({ success: true, job: formattedJob });
        } else {
          console.log(`❌ External job not found in database: ${id}`);
          return NextResponse.json(
            { success: false, error: 'External job not found' },
            { status: 404 }
          );
        }
>>>>>>> 72b2f20a89c670956b29be8726080635e9bb5a6e
      }
    }
    
    // Handle numeric/database job IDs
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID format' },
        { status: 400 }
      );
    }
    
    // Get job details with company information for database jobs
    const job = await prisma.job.findUnique({
      where: { id: numericId },
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
    
    // Format database job data
    const formattedJob = {
      ...job,
      company: job.company || job.companyRelation?.name,
      companyLogo: job.companyLogo || job.companyRelation?.logo,
      companyLocation: job.companyRelation?.location,
      companyIndustry: job.companyRelation?.industry,
      companyWebsite: job.companyRelation?.website,
      skills: typeof job.skills === 'string' ? JSON.parse(job.skills || '[]') : (job.skills || []),
      applications: job.applicationsCount || 0,
      applicationsCount: job.applicationsCount || 0,
      apply_url: job.apply_url || null,
      source_url: job.source_url || null,
      isExternal: job.source !== 'manual',
      companyRelation: {
        name: job.company || job.companyRelation?.name,
        logo: job.companyLogo || job.companyRelation?.logo,
        location: job.companyRelation?.location,
        industry: job.companyRelation?.industry,
        website: job.companyRelation?.website
      }
    };
    
    console.log(`✅ Found database job: ${formattedJob.title}`);
    
    return NextResponse.json({
      success: true,
      job: formattedJob
    });
    
  } catch (error) {
    console.error('❌ Error fetching job details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job details' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
