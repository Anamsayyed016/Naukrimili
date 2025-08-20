import type { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's resumes
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { resumes: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ resumes: user.resumes });
  } catch (error) {
    console.error('GET resumes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const targetRole = formData.get('targetRole') as string;
    const experienceLevel = formData.get('experienceLevel') as string;
    const industryType = formData.get('industryType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create resume record
    const resume = await prisma.resume.create({
      data: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        userId: user.id,
        isActive: true,
        parsedData: {
          targetRole,
          experienceLevel,
          industryType,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Resume uploaded successfully',
      resumeId: resume.id
    });

  } catch (error) {
    console.error('POST resume upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


