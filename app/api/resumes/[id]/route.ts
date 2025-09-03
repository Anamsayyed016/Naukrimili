import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
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

    const resume = await prisma.resume.findFirst({
      where: { 
        id: params.id,
        userId: user.id 
      }
    });

    if (!resume) {
      return NextResponse.json({
        success: false,
        error: 'Resume not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: resume
    });

  } catch (error) {
    console.error('Error fetching resume:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch resume'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
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

    const body = await request.json();
    const { isActive, fileName, parsedData } = body;

    const updateData: any = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (fileName) updateData.fileName = fileName;
    if (parsedData) updateData.parsedData = parsedData;

    // If setting as active, deactivate all other resumes first
    if (isActive) {
      await prisma.resume.updateMany({
        where: { 
          userId: user.id,
          isActive: true 
        },
        data: { isActive: false }
      });
    }

    const updatedResume = await prisma.resume.update({
      where: { 
        id: params.id,
        userId: user.id 
      },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: "Resume updated successfully",
      data: updatedResume
    });

  } catch (error) {
    console.error('Error updating resume:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update resume'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
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

    // Check if resume exists and belongs to user
    const resume = await prisma.resume.findFirst({
      where: { 
        id: params.id,
        userId: user.id 
      }
    });

    if (!resume) {
      return NextResponse.json({
        success: false,
        error: 'Resume not found'
      }, { status: 404 });
    }

    // Delete resume
    await prisma.resume.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: "Resume deleted successfully"
    });

  } catch (error) {
    console.error('Error deleting resume:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete resume'
    }, { status: 500 });
  }
}