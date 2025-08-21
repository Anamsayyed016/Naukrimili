import { NextRequest, NextResponse } from 'next/server';
import { requireEmployerAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const jobId = parseInt(params.id, 10);

    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    // Verify the job belongs to the employer's company
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: user.company.id
      },
      include: {
        companyRelation: {
          select: {
            id: true,
            name: true,
            logo: true,
            industry: true
          }
        },
        _count: {
          select: {
            applications: true,
            bookmarks: true
          }
        }
      }
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error fetching job details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const jobId = parseInt(params.id, 10);

    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      location,
      jobType,
      experienceLevel,
      salaryMin,
      salaryMax,
      isRemote,
      isActive
    } = body;

    // Verify the job belongs to the employer's company
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: user.company.id
      }
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      );
    }

    // Update the job
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        title,
        description,
        location,
        jobType,
        experienceLevel,
        salaryMin,
        salaryMax,
        isRemote,
        isActive,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedJob,
      message: 'Job updated successfully'
    });
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireEmployerAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const jobId = parseInt(params.id, 10);

    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    // Verify the job belongs to the employer's company
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: user.company.id
      }
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the job
    await prisma.job.delete({
      where: { id: jobId }
    });

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

