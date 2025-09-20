import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const where: any = { userId: user.id };

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { job: { title: { contains: search, mode: "insensitive" } } },
        { job: { company: { contains: search, mode: "insensitive" } } }
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              location: true,
              jobType: true,
              salary: true,
              isRemote: true
            }
          },
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
              website: true
            }
          }
        },
        orderBy: { appliedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.application.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch applications'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const formData = await request.formData();
    const jobId = formData.get('jobId') as string;
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const location = formData.get('location') as string;
    const coverLetter = formData.get('coverLetter') as string;
    const expectedSalary = formData.get('expectedSalary') as string;
    const availability = formData.get('availability') as string;
    const resume = formData.get('resume') as File;

    // Validate required fields
    if (!jobId || !fullName || !email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: jobId, fullName, and email are required'
      }, { status: 400 });
    }

    // Check if job exists in database first
    let job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    // If not found in database, check if it's a sample job
    if (!job) {
      const sampleJobIds = ['1', '2', '3', '4', '5', '6', '7', '8'];
      if (sampleJobIds.includes(jobId)) {
        // For sample jobs, we'll create a mock job object
        job = {
          id: jobId,
          title: `Sample Job ${jobId}`,
          companyId: null, // Will be set to user's company below
          isActive: true
        } as any;
      } else {
        return NextResponse.json({
          success: false,
          error: 'Job not found'
        }, { status: 404 });
      }
    }

    // Check if user already applied for this job
    const existingApplication = await prisma.application.findFirst({
      where: {
        userId: user.id,
        jobId: jobId
      }
    });

    if (existingApplication) {
      return NextResponse.json({
        success: false,
        error: 'You have already applied for this job'
      }, { status: 409 });
    }

    // Handle resume upload if provided
    let resumeUrl = null;
    if (resume && resume.size > 0) {
      // In a real application, you would upload to a file storage service
      // For now, we'll store the filename
      resumeUrl = `resumes/${user.id}/${Date.now()}-${resume.name}`;
    }

    // For sample jobs, we need to find the employer's company to link the application
    let companyId = job.companyId;
    if (!companyId) {
      // For sample jobs, we'll link to the first available company (or create a default one)
      // In a real scenario, sample jobs would be linked to specific companies
      const firstCompany = await prisma.company.findFirst({
        orderBy: { createdAt: 'asc' }
      });
      companyId = firstCompany?.id || null;
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        userId: user.id,
        jobId: jobId,
        notes: coverLetter || null,
        status: 'submitted',
        appliedAt: new Date(),
        coverLetter: coverLetter || null,
        resumeId: resumeUrl || '',
        companyId: companyId
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Send real-time notification to employer
    try {
      const { getSocketService } = await import('@/lib/socket-server');
      const socketService = getSocketService();
      
      if (socketService && companyId) {
        // Get company users (employers) by finding users who created jobs for this company
        const companyUsers = await prisma.user.findMany({
          where: { 
            role: 'employer',
            // Find users who created jobs for this company
            createdJobs: {
              some: {
                companyId: companyId
              }
            }
          },
          select: { id: true }
        });

        if (companyUsers.length > 0) {
          const userIds = companyUsers.map(u => u.id);
          
          await socketService.sendNotificationToUsers(userIds, {
            type: 'JOB_APPLICATION_RECEIVED',
            title: 'New Job Application Received! 🎉',
            message: `${user.name} applied for the position "${application.job.title}" at ${application.job.company}`,
            data: {
              applicationId: application.id,
              jobId: jobId,
              applicantName: user.name,
              applicantEmail: user.email,
              jobTitle: application.job.title,
              company: application.job.company,
              actionUrl: `/employer/applications/${application.id}`
            }
          });
        }
      }
    } catch (socketError) {
      console.error('Failed to send socket notification:', socketError);
      // Don't fail the application if socket notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: application.id,
        jobTitle: application.job.title,
        company: application.job.company,
        appliedAt: application.appliedAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to submit application'
    }, { status: 500 });
  }
}