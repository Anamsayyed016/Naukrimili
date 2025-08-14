import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Application creation schema
const createApplicationSchema = z.object({
  jobId: z.number().positive(),
  userId: z.string().min(1),
  resumeId: z.string().optional(),
  coverLetter: z.string().optional(),
  notes: z.string().optional(),
});

// Get user from request (simple implementation)
function getUserFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-user-id') || null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // Build where condition
    const whereCondition: any = { userId };
    if (status) {
      whereCondition.status = status;
    }

    // Get applications with job details
    const applications = await prisma.application.findMany({
      where: whereCondition,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            salary: true,
            jobType: true,
            isRemote: true,
          }
        },
        resume: {
          select: {
            id: true,
            fileName: true,
          }
        }
      },
      orderBy: { appliedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get total count
    const total = await prisma.application.count({
      where: whereCondition,
    });

    // Transform for frontend
    const transformedApplications = applications.map(app => ({
      id: app.id,
      jobId: app.jobId,
      jobTitle: app.job.title,
      company: app.job.company,
      location: app.job.location,
      salary: app.job.salary,
      jobType: app.job.jobType,
      isRemote: app.job.isRemote,
      status: app.status,
      appliedAt: app.appliedAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      coverLetter: app.coverLetter,
      notes: app.notes,
      resume: app.resume ? {
        id: app.resume.id,
        fileName: app.resume.fileName,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      applications: transformedApplications,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_results: total,
        per_page: limit,
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Applications GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch applications',
      applications: [],
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const contentType = request.headers.get('content-type') || '';
    let payload: Record<string, unknown> = {};

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const name = form.get('name')?.toString() || '';
      const email = form.get('email')?.toString() || '';
      const jobId = parseInt(form.get('jobId')?.toString() || '0');
      const coverLetter = form.get('coverLetter')?.toString() || '';
      const file = form.get('file');
      
      // For form data, we need to derive userId from email or use header
      const userId = getUserFromRequest(request) || email; // Fallback to email as userId
      
      payload = { 
        userId,
        jobId, 
        coverLetter: coverLetter || `Application from ${name} (${email})`,
        notes: `Applied via form with file: ${file ? (file as File).name : 'No file'}`,
      };
    } else {
      payload = await request.json();
      // Ensure userId is present
      if (!payload.userId) {
        payload.userId = getUserFromRequest(request);
      }
    }

    // Validate data
    const validatedData = createApplicationSchema.parse(payload);

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: validatedData.jobId },
      select: { id: true, title: true, company: true }
    });

    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found',
      }, { status: 404 });
    }

    // Check if user already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        userId_jobId: {
          userId: validatedData.userId,
          jobId: validatedData.jobId,
        }
      }
    });

    if (existingApplication) {
      return NextResponse.json({
        success: false,
        error: 'Already applied',
        message: 'You have already applied for this job',
      }, { status: 409 });
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        userId: validatedData.userId,
        jobId: validatedData.jobId,
        resumeId: validatedData.resumeId,
        coverLetter: validatedData.coverLetter,
        notes: validatedData.notes,
        status: 'submitted',
      },
      include: {
        job: {
          select: {
            title: true,
            company: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        id: application.id,
        jobId: application.jobId,
        jobTitle: application.job.title,
        company: application.job.company,
        status: application.status,
        appliedAt: application.appliedAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    }, { status: 201 });

  } catch (error: any) {
    console.error('Applications POST error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid application data',
        details: error.errors,
      }, { status: 400 });
    }

    // Handle Prisma errors
    if (error.code === 'P2002') { // Unique constraint violation
      return NextResponse.json({
        success: false,
        error: 'Already applied',
        message: 'You have already applied for this job',
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to submit application',
      message: error.message,
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}


