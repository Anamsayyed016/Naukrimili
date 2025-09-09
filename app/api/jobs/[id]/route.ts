import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 Job API called with ID:', id);
    
    // Check if this is an external job ID first
    if (id.startsWith('ext-')) {
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
