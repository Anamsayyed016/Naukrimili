import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { z } from 'zod';

const applicationSchema = z.object({
  jobId: z.number().int().positive(),
  coverLetter: z.string().optional(),
  resumeId: z.number().int().positive().optional(),
  notes: z.string().optional()
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user } = auth;

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

    // Transform data to match expected format
    const transformedApplications = applications.map(app => ({
      id: app.id,
      status: app.status,
      appliedAt: app.appliedAt,
      coverLetter: app.coverLetter,
      notes: app.notes,
      job: {
        id: app.job.id,
        title: app.job.title,
        company: app.job.company,
        location: app.job.location,
        salary: app.job.salary,
        jobType: app.job.jobType,
        experienceLevel: app.job.experienceLevel,
        isRemote: app.job.isRemote,
        companyInfo: app.job.companyRelation ? {
          name: app.job.companyRelation.name,
          logo: app.job.companyRelation.logo,
          industry: app.job.companyRelation.industry
        } : null
      },
      resume: app.resume
    }));

    return NextResponse.json({
      success: true,
      data: {
        applications: transformedApplications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Applications GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user } = auth;

  try {
    const body = await request.json();
    const { jobId, coverLetter, resumeId, notes } = applicationSchema.parse(body);

    // Check if user has already applied to this job
    const existingApplication = await prisma.application.findFirst({
      where: {
        userId: user.id,
        jobId: jobId
      }
    });

    if (existingApplication) {
      return NextResponse.json(
        { success: false, error: 'You have already applied to this job' },
        { status: 400 }
      );
    }

    // Get job details to verify it exists and is active
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        company: true,
        isActive: true,
        companyId: true
      }
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    if (!job.isActive) {
      return NextResponse.json(
        { success: false, error: 'This job is no longer accepting applications' },
        { status: 400 }
      );
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        userId: user.id,
        jobId: jobId,
        companyId: job.companyId || 0,
        coverLetter: coverLetter || '',
        notes: notes || '',
        status: 'submitted',
        appliedAt: new Date()
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true
          }
        }
      }
    });

    // Update job applications count
    await prisma.job.update({
      where: { id: jobId },
      data: {
        applicationsCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: application,
      message: 'Application submitted successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Applications POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}


