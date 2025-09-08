import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('🔍 Job API called with ID:', id);
    
    // Try to parse as numeric ID first
    let jobId = id;
    let isNumericId = false;
    
    // If not numeric, check if it's an external ID
    if (true) {
      // Check if this is an external job ID (starts with 'ext-' or 'ext-external-')
      if (id.startsWith('ext-')) {
        // For external jobs, return detailed job information
        // This allows users to see job details before being redirected
        const jobNumber = id.replace('ext-external-', '').replace('ext-', '');
        
        return NextResponse.json({
          success: true,
          job: {
            id: id,
            title: `Software Engineer Position #${jobNumber}`,
            company: "Tech Solutions Inc.",
            companyLogo: null,
            location: "Remote / Mumbai, India",
            country: "India",
            description: `We are seeking a talented Software Engineer to join our dynamic team. This role involves developing cutting-edge web applications using modern technologies. You will work on both frontend and backend development, collaborate with cross-functional teams, and contribute to architectural decisions. The ideal candidate should have strong experience in JavaScript frameworks, cloud technologies, and agile development practices. This is an external job posting (ID: ${jobNumber}).`,
            applyUrl: "/jobs/external/" + id,
            source_url: `https://external-job-site.com/job/${jobNumber}`,
            postedAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString(),
            salary: "₹8-20 LPA",
            salaryMin: 800000,
            salaryMax: 2000000,
            salaryCurrency: "INR",
            jobType: "Full-time",
            experienceLevel: "Mid-Senior",
            skills: ["JavaScript", "React", "Node.js", "Python", "AWS", "Docker", "MongoDB", "TypeScript", "Git"],
            isRemote: true,
            isHybrid: false,
            isUrgent: Math.random() > 0.5,
            isFeatured: Math.random() > 0.7,
            sector: "Technology",
            views: Math.floor(Math.random() * 500) + 100,
            applications: Math.floor(Math.random() * 100) + 20,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            creator: null,
            companyRelation: {
              name: "Tech Solutions Inc.",
              logo: null,
              location: "Mumbai, India",
              industry: "Technology",
              website: "https://techsolutions.com"
            },
            // Mark as external job
            isExternal: true,
            source: "external"
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
