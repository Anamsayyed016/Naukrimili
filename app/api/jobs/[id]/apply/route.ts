import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const applyJobSchema = z.object({
  coverLetter: z.string().optional(),
  resumeId: z.number().int().positive().optional(),
  notes: z.string().optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require authentication
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user } = auth;

  try {
    // Parse and validate job ID
    const jobId = parseInt(params.id);
    if (isNaN(jobId) || jobId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid job ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const { coverLetter, resumeId, notes } = applyJobSchema.parse(body);

    // Check if job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        company: true,
        isActive: true,
        companyId: true,
        companyRelation: {
          select: {
            name: true,
            isVerified: true
          }
        }
      }
    });

    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }

    if (!job.isActive) {
      return NextResponse.json({
        success: false,
        error: 'This job is no longer accepting applications'
      }, { status: 400 });
    }

    // Check if user already applied for this job
    const existingApplication = await prisma.application.findFirst({
      where: {
        jobId: jobId,
        userId: user.id
      }
    });

    if (existingApplication) {
      return NextResponse.json({
        success: false,
        error: 'You have already applied for this job'
      }, { status: 400 });
    }

    // Validate resume if provided
    if (resumeId) {
      const resume = await prisma.resume.findFirst({
        where: {
          id: resumeId,
          userId: user.id,
          isActive: true
        }
      });

      if (!resume) {
        return NextResponse.json({
          success: false,
          error: 'Selected resume not found or inactive'
        }, { status: 400 });
      }
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        jobId: jobId,
        userId: user.id,
        companyId: job.companyId || 0,
        status: 'submitted',
        coverLetter: coverLetter || '',
        notes: notes || '',
        resumeId: resumeId || null,
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
        },
        resume: {
          select: {
            fileName: true,
            fileUrl: true
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
      data: {
        application: {
          id: application.id,
          jobId: application.jobId,
          status: application.status,
          appliedAt: application.appliedAt,
          job: application.job,
          resume: application.resume
        }
      },
      message: 'Application submitted successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Job application error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid application data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to submit application',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
