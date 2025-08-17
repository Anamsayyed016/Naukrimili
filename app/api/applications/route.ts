import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { z } from 'zod';

const applicationSchema = z.object({
  jobId: z.number().int().positive(),
  coverLetter: z.string().optional(),
  resumeId: z.string().optional(),
  notes: z.string().optional()
});

interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

async function requireAuth(request: NextRequest): Promise<{ user: AuthenticatedUser | null; response: NextResponse | null }> {
  const session = await getServerSession(authOptions as any);
  if (!session || typeof session !== 'object' || !session.user || typeof session.user !== 'object') {
    return { user: null, response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  
  const user = session.user as any;
  if (!user.email) {
    return { user: null, response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  
  return { 
    user: {
      id: user.id || user.email,
      email: user.email,
      name: user.name,
      role: user.role
    }, 
    response: null 
  };
}

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth(request);
  if (!user) return response!;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId: user.id };
    if (status) {
      where.status = status;
    }

    // Get applications with pagination and related data
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedAt: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              location: true,
              salary: true,
              jobType: true,
              experienceLevel: true,
              isRemote: true,
              companyRelation: {
                select: {
                  name: true,
                  logo: true,
                  industry: true
                }
              }
            }
          },
          company: {
            select: {
              name: true,
              logo: true,
              industry: true
            }
          },
          resume: {
            select: {
              fileName: true,
              fileUrl: true
            }
          }
        }
      }),
      prisma.application.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    // Transform applications for frontend
    const transformedApplications = applications.map(app => ({
      id: app.id,
      jobId: app.jobId,
      jobTitle: app.job.title,
      company: app.job.company || app.job.companyRelation?.name || app.company?.name,
      companyLogo: app.job.companyRelation?.logo || app.company?.logo,
      location: app.job.location,
      salary: app.job.salary,
      jobType: app.job.jobType,
      experienceLevel: app.job.experienceLevel,
      isRemote: app.job.isRemote,
      status: app.status,
      appliedAt: app.appliedAt,
      updatedAt: app.updatedAt,
      coverLetter: app.coverLetter,
      notes: app.notes,
      resume: app.resume ? {
        fileName: app.resume.fileName,
        fileUrl: app.resume.fileUrl
      } : null
    }));

    return NextResponse.json({
      success: true,
      applications: transformedApplications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Applications GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch applications'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth(request);
  if (!user) return response!;

  try {
    const contentType = request.headers.get('content-type') || '';
    let payload: any = {};

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      payload = {
        jobId: parseInt(form.get('jobId')?.toString() || '0'),
        coverLetter: form.get('coverLetter')?.toString() || '',
        resumeId: form.get('resumeId')?.toString(),
        notes: form.get('notes')?.toString() || ''
      };
    } else {
      payload = await request.json();
    }

    // Validate payload
    const validatedData = applicationSchema.parse(payload);

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: validatedData.jobId }
    });

    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }

    // Check if already applied
    const existingApplication = await prisma.application.findFirst({
      where: {
        userId: user.id,
        jobId: validatedData.jobId
      }
    });

    if (existingApplication) {
      return NextResponse.json({
        success: false,
        error: 'You have already applied for this job'
      }, { status: 409 });
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        userId: user.id,
        jobId: validatedData.jobId,
        resumeId: validatedData.resumeId,
        coverLetter: validatedData.coverLetter,
        notes: validatedData.notes,
        status: 'submitted'
      },
      include: {
        job: {
          select: {
            title: true,
            company: true,
            companyRelation: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Update job application count
    await prisma.job.update({
      where: { id: validatedData.jobId },
      data: {
        applicationsCount: {
          increment: 1
        }
      }
    });

    // Create notification for employer (if company exists)
    if (job.companyId) {
      await prisma.message.create({
        data: {
          conversationId: `job_${job.id}_applications`,
          senderId: user.id,
          receiverId: job.companyId,
          content: `New application received for ${job.title}`,
          messageType: 'notification',
          isRead: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        jobId: application.jobId,
        jobTitle: application.job.title,
        company: application.job.company || application.job.companyRelation?.name,
        status: application.status,
        appliedAt: application.appliedAt
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Applications POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create application'
    }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}


