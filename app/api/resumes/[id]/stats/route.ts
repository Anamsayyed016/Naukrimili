import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import { getResumeViewStats } from '@/lib/resume-view-tracker';

/**
 * GET /api/resumes/[id]/stats
 * Get resume view statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Verify user owns the resume
    const resume = await prisma.resume.findFirst({
      where: { 
        id: id,
        userId: user.id 
      }
    });

    if (!resume) {
      return NextResponse.json({
        success: false,
        error: 'Resume not found or access denied'
      }, { status: 404 });
    }

    // Get view statistics
    const stats = await getResumeViewStats(resume.id);

    return NextResponse.json({
      success: true,
      data: {
        resumeId: resume.id,
        resumeName: resume.fileName,
        stats
      }
    });

  } catch (error) {
    console.error('Error getting resume stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get resume statistics'
    }, { status: 500 });
  }
}
