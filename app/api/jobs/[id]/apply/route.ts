import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const jobId = params.id;
    const body = await request.json();

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if user already applied for this job
    const existingApplication = await prisma.application.findFirst({
      where: {
        jobId: jobId,
        userId: session.user.id
      }
    });

    if (existingApplication) {
      return NextResponse.json(
        { success: false, error: 'You have already applied for this job' },
        { status: 400 }
      );
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        jobId: jobId,
        userId: session.user.id,
        status: 'submitted',
        coverLetter: body.coverLetter || '',
        resumeId: body.resumeId || null,
        appliedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: application,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Error applying for job:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
