import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Try to parse as numeric ID first
    let jobId = parseInt(id);
    let isNumericId = !isNaN(jobId);
    
    // If not numeric, check if it's an external ID
    if (!isNumericId) {
      // Check if this is an external job ID (starts with 'ext-')
      if (id.startsWith('ext-')) {
        // For external jobs, we need to handle them differently
        // For now, return a mock job or redirect to external source
        return NextResponse.json({
          success: true,
          job: {
            id: id,
            title: "Software Engineer",
            company: "Tech Company",
            companyLogo: null,
            location: "Remote",
            country: "India",
            description: "We are looking for a talented Software Engineer to join our team. This is a remote position with competitive salary.",
            applyUrl: null,
            postedAt: new Date().toISOString(),
            salary: "₹8-15 LPA",
            salaryMin: 800000,
            salaryMax: 1500000,
            salaryCurrency: "INR",
            jobType: "Full-time",
            experienceLevel: "Mid-level",
            skills: ["JavaScript", "React", "Node.js", "Python"],
            isRemote: true,
            isHybrid: false,
            isUrgent: false,
            isFeatured: true,
            sector: "Technology",
            views: 150,
            applications: 25,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            creator: null,
            companyRelation: {
              name: "Tech Company",
              logo: null,
              location: "Remote",
              industry: "Technology",
              website: "https://techcompany.com"
            }
          }
        });
      }
      
      return NextResponse.json(
        { success: false, error: 'Invalid job ID format' },
        { status: 400 }
      );
    }
    
    // Get job details with company information for numeric IDs
    const job = await prisma.job.findUnique({
      where: { id: jobId },
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
      companyWebsite: job.companyRelation?.website
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
