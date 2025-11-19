import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateId, resumeType, formData } = body;

    if (!templateId || !resumeType || !formData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Deactivate other resumes if setting as active
    await prisma.resume.updateMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      data: { isActive: false },
    });

    // Create resume with builder data
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        fileName: `resume-${templateId}-${Date.now()}.json`,
        fileUrl: '',
        fileSize: JSON.stringify(formData).length,
        mimeType: 'application/json',
        parsedData: formData,
        isBuilder: true,
        templateStyle: templateId,
        builderData: formData,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Resume saved successfully',
      resumeId: resume.id,
    });
  } catch (error) {
    console.error('Error saving resume:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save resume',
      },
      { status: 500 }
    );
  }
}

