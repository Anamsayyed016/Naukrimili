import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";
import {
  canEditResume,
  recordResumeEdit,
  hasMeaningfulResumeDataChange,
} from '@/lib/services/payment-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { id } = await params;
    const resume = await prisma.resume.findFirst({
      where: {
        id: id,
        userId: session.user.id
      },
      include: {
        applications: {
          select: {
            id: true,
            status: true,
            appliedAt: true,
            job: {
              select: {
                id: true,
                title: true,
                company: true,
                location: true
              }
            }
          },
          orderBy: { appliedAt: 'desc' }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    if (!resume) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resume
    });
  } catch (_error) {
    console.error('Error fetching resume:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const isAdmin = session.user.role === 'admin';

    const { id } = await params;
    const body = await request.json();
    const { isActive, parsedData, atsScore } = body;

    const existingResume = await prisma.resume.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    });

    if (!existingResume) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    const nextParsedData = parsedData !== undefined ? parsedData : existingResume.parsedData;
    const meaningfulChange = hasMeaningfulResumeDataChange(
      existingResume.parsedData,
      nextParsedData
    );

    if (!isAdmin && meaningfulChange) {
      const editCheck = await canEditResume(session.user.id);
      if (!editCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: editCheck.reason || 'Your plan has expired. Please renew your plan to edit resumes.',
            isPlanExpired: true,
            requiresPayment: true,
            isLocked: editCheck.isLocked || false,
          },
          { status: 403 }
        );
      }
    }

    // If setting as active, deactivate other resumes
    if (isActive) {
      await prisma.resume.updateMany({
        where: {
          userId: session.user.id,
          isActive: true,
          id: { not: id }
        },
        data: {
          isActive: false
        }
      });
    }

    const updatedResume = await prisma.resume.update({
      where: { id },
      data: {
        isActive: isActive !== undefined ? isActive : existingResume.isActive,
        parsedData: nextParsedData,
        atsScore: atsScore !== undefined ? atsScore : existingResume.atsScore,
        updatedAt: new Date()
      }
    });

    if (!isAdmin && meaningfulChange) {
      await recordResumeEdit(session.user.id);
    }

    return NextResponse.json({
      success: true,
      data: updatedResume,
      message: 'Resume updated successfully',
      editQuotaConsumed: meaningfulChange && !isAdmin,
    });
  } catch (_error) {
    console.error('Error updating resume:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update resume' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Verify resume belongs to user
    const existingResume = await prisma.resume.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    if (!existingResume) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Check if resume has active applications
    const activeApplications = await prisma.application.count({
      where: {
        resumeId: params.id,
        status: { in: ['submitted', 'reviewed', 'interview'] }
      }
    });

    if (activeApplications > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete resume with active applications. Please withdraw applications first.' 
        },
        { status: 400 }
      );
    }

    // Delete resume
    await prisma.resume.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (_error) {
    console.error('Error deleting resume:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete resume' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
