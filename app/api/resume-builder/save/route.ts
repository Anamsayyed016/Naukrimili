import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import {
  canEditResume,
  recordResumeEdit,
  hasMeaningfulResumeDataChange,
} from '@/lib/services/payment-service';

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
    const { templateId, resumeType, formData, colorScheme } = body;

    if (!templateId || !resumeType || !formData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const isAdmin = session.user.role === 'admin';

    const existingResume = await prisma.resume.findFirst({
      where: {
        userId: user.id,
        isBuilder: true,
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const previousData = existingResume?.builderData ?? existingResume?.parsedData ?? null;
    const meaningfulChange = hasMeaningfulResumeDataChange(previousData, formData);

    if (!isAdmin && meaningfulChange) {
      const editCheck = await canEditResume(user.id);
      if (!editCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: editCheck.reason || 'Resume editing is not available on your current plan.',
            isPlanExpired: editCheck.isLocked ?? false,
            requiresPayment: true,
            isLocked: editCheck.isLocked || false,
          },
          { status: 403 }
        );
      }
    }

    let resume;

    if (existingResume) {
      resume = await prisma.resume.update({
        where: { id: existingResume.id },
        data: {
          fileName: `resume-${templateId}-${Date.now()}.json`,
          fileSize: JSON.stringify(formData).length,
          parsedData: formData,
          builderData: formData,
          templateStyle: templateId,
          colorScheme: colorScheme || null,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.resume.updateMany({
        where: {
          userId: user.id,
          isActive: true,
        },
        data: { isActive: false },
      });

      resume = await prisma.resume.create({
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
          colorScheme: colorScheme || null,
          isActive: true,
        },
      });
    }

    if (!isAdmin && meaningfulChange) {
      await recordResumeEdit(user.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Resume saved successfully',
      resumeId: resume.id,
      editQuotaConsumed: meaningfulChange && !isAdmin,
    });
  } catch (error: any) {
    console.error('Error saving resume:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to save resume',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
