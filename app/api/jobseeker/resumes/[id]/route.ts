import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/nextauth-config";

import { prisma } from "@/lib/prisma";

export async function GET(
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

    const resume = await prisma.resume.findFirst({
      where: {
        id: params.id,
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
  } catch (error) {
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

    const body = await request.json();
    const { isActive, parsedData, atsScore } = body;

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

    // If setting as active, deactivate other resumes
    if (isActive) {
      await prisma.resume.updateMany({
        where: {
          userId: session.user.id,
          isActive: true,
          id: { not: params.id }
        },
        data: {
          isActive: false
        }
      });
    }

    const updatedResume = await prisma.resume.update({
      where: { id: params.id },
      data: {
        isActive: isActive !== undefined ? isActive : existingResume.isActive,
        parsedData: parsedData || existingResume.parsedData,
        atsScore: atsScore !== undefined ? atsScore : existingResume.atsScore,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedResume,
      message: 'Resume updated successfully'
    });
  } catch (error) {
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
  } catch (error) {
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
