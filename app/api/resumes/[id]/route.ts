import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';

// GET specific resume
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const resumeId = parseInt(params.id);
    if (isNaN(resumeId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid resume ID' 
      }, { status: 400 });
    }

    // Get resume with user info
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    });

    if (!resume) {
      return NextResponse.json({ 
        success: false, 
        error: 'Resume not found' 
      }, { status: 404 });
    }

    // Check if user owns this resume or is admin
    if (resume.user.email !== session.user.email && session.user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied' 
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      resume: {
        id: resume.id,
        fileName: resume.fileName,
        fileUrl: resume.fileUrl,
        fileSize: resume.fileSize,
        mimeType: resume.mimeType,
        parsedData: resume.parsedData,
        atsScore: resume.atsScore,
        isActive: resume.isActive,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
        user: resume.user
      }
    });

  } catch (error) {
    console.error('GET resume error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// PUT update resume
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const resumeId = parseInt(params.id);
    if (isNaN(resumeId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid resume ID' 
      }, { status: 400 });
    }

    // Check if resume exists and user owns it
    const existingResume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: { user: true }
    });

    if (!existingResume) {
      return NextResponse.json({ 
        success: false, 
        error: 'Resume not found' 
      }, { status: 404 });
    }

    if (existingResume.user.email !== session.user.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { isActive, parsedData } = body;

    // Update resume
    const updatedResume = await prisma.resume.update({
      where: { id: resumeId },
      data: {
        isActive: isActive !== undefined ? isActive : existingResume.isActive,
        parsedData: parsedData || existingResume.parsedData,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Resume updated successfully',
      resume: updatedResume
    });

  } catch (error) {
    console.error('PUT resume error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE resume
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const resumeId = parseInt(params.id);
    if (isNaN(resumeId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid resume ID' 
      }, { status: 400 });
    }

    // Check if resume exists and user owns it
    const existingResume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: { user: true }
    });

    if (!existingResume) {
      return NextResponse.json({ 
        success: false, 
        error: 'Resume not found' 
      }, { status: 404 });
    }

    if (existingResume.user.email !== session.user.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied' 
      }, { status: 403 });
    }

    // Delete the physical file
    try {
      const filePath = path.join(process.cwd(), existingResume.fileUrl);
      await unlink(filePath);
      console.log('✅ Physical file deleted:', filePath);
    } catch (fileError) {
      console.warn('⚠️ Could not delete physical file:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.resume.delete({
      where: { id: resumeId }
    });

    return NextResponse.json({
      success: true,
      message: 'Resume deleted successfully'
    });

  } catch (error) {
    console.error('DELETE resume error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}