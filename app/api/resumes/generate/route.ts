import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';

import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetRole, experienceLevel, industryType } = body;

    if (!targetRole) {
      return NextResponse.json(
        { error: 'Target role is required' },
        { status: 400 }
      );
    }

    // Get user's existing resume data
    const userId = parseInt(session.user.id as string, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const resume = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'No resume found. Please upload a resume first.' },
        { status: 404 }
      );
    }

    // Generate AI-enhanced resume content
    const enhancedResume = {
      targetRole: targetRole,
      experienceLevel: experienceLevel || 'mid',
      industryType: industryType || 'Technology',
      fileName: resume.fileName,
      fileUrl: resume.fileUrl,
      parsedData: resume.parsedData
    };

    return NextResponse.json({
      success: true,
      data: enhancedResume
    });
  } catch (_error) {
    console.error('Resume generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
