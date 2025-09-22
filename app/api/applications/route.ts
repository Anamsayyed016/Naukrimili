import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";
import { getSocketService } from "@/lib/socket-server";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/applications called');
    const session = await auth();
    
    if (!session?.user?.email) {
      console.log('❌ No session or email found');
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    console.log('�� Session user:', { email: session.user.email });

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
      console.log('❌ User not found for email:', session.user.email);
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }
    
    console.log('✅ User found:', { userId: user.id, email: user.email, role: user.role });

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

    console.log('🔍 Querying applications with where clause:', where);
    
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
    
    console.log('📊 Applications query results:', { 
      applicationsCount: applications.length, 
      total, 
      where 
    });

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
    console.log('🔍 POST /api/applications called');
    const session = await auth();
    
    if (!session?.user?.email) {
      console.log('❌ No session or email found');
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    console.log('�� Session user:', { email: session.user.email });

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.log('❌ User not found for email:', session.user.email);
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }
    
    console.log('✅ User found:', { userId: user.id, email: user.email, role: user.role });

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

    console.log('📝 Form data received:', {
      jobId,
      fullName,
      email,
      phone,
      coverLetter: coverLetter?.substring(0, 50) + '...',
      resumeSize: resume?.size || 0
    });

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
        console.log('❌ Job not found for ID:', jobId);
        return NextResponse.json({
          success: false,
          error: 'Job not found. Please check the job ID and try again.'
        }, { status: 404 });
      }
    }

    console.log('✅ Job found:', { jobId: job.id, title: job.title, companyId: job.companyId });

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

    console.log('🔍 Creating application with data:', {
      userId: user.id,
      jobId: jobId,
      companyId: companyId,
      jobTitle: job.title
    });

    // Create application
    const application = await prisma.application.create({
      data: {
        userId: user.id,
        jobId: jobId,
        notes: coverLetter || null,
        status: 'submitted',
        appliedAt: new Date(),
        coverLetter: coverLetter || null,
        resumeId: resumeUrl || null,
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

    console.log('✅ Application created successfully:', application.id);

    // Send real-time notification via Socket.io
    const socketService = getSocketService();
    if (socketService) {
      try {
        // Notify the job seeker about successful application
        await socketService.sendNotificationToUser(user.id, {
          type: 'APPLICATION_SUBMITTED',
          title: '🎉 Application Submitted Successfully!',
          message: `Your application for "${application.job.title}" at ${application.job.company} has been submitted successfully. You'll hear back from the employer soon!`,
          data: {
            applicationId: application.id,
            jobId: application.jobId,
            companyId: application.companyId,
            jobTitle: application.job.title,
            companyName: application.job.company
          }
        });

        // Also create a database notification for persistence
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'APPLICATION_SUBMITTED',
            title: 'Application Submitted Successfully!',
            message: `Your application for "${application.job.title}" at ${application.job.company} has been submitted successfully.`,
            data: {
              applicationId: application.id,
              jobId: application.jobId,
              companyId: application.companyId
            }
          }
        });

        console.log('📤 Real-time notifications sent for new application');
      } catch (socketError) {
        console.warn('⚠️ Failed to send real-time notifications:', socketError);
        // Don't fail the application creation if socket fails
      }
    } else {
      // Fallback: Create database notification even if socket fails
      try {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'APPLICATION_SUBMITTED',
            title: 'Application Submitted Successfully!',
            message: `Your application for "${application.job.title}" at ${application.job.company} has been submitted successfully.`,
            data: {
              applicationId: application.id,
              jobId: application.jobId,
              companyId: application.companyId
            }
          }
        });
        console.log('📝 Database notification created as fallback');
      } catch (notificationError) {
        console.warn('⚠️ Failed to create database notification:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: application.id,
        jobTitle: application.job.title,
        company: application.job.company,
        appliedAt: application.appliedAt,
        application: application // Include full application for real-time updates
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating application:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit application',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}
