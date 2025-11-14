import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import { ResumeBuilderDataSchema } from '@/app/resume-builder/types';

/**
 * POST /api/resumes/builder/save
 * Save resume created with the resume builder
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { resumeData, template, experienceLevel } = body;

    // Validate resume data
    const validation = ResumeBuilderDataSchema.safeParse(resumeData);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid resume data',
        details: validation.error.errors
      }, { status: 400 });
    }

    // Prepare resume data for database
    const resumeToSave = {
      userId: user.id,
      fileName: `${resumeData.personalInfo.fullName || 'resume'}-${Date.now()}.json`,
      fileUrl: '', // Builder resumes don't have file URLs
      fileSize: 0,
      mimeType: 'application/json',
      parsedData: resumeData,
      atsScore: resumeData.metadata?.atsScore || 0,
      isActive: true,
      isBuilder: true, // Mark as builder resume
      templateStyle: template,
      builderData: resumeData,
      colorScheme: resumeData.template.colorScheme,
    };

    // Save resume
    const savedResume = await prisma.resume.create({
      data: resumeToSave
    });

    return NextResponse.json({
      success: true,
      message: 'Resume saved successfully',
      resume: {
        id: savedResume.id,
        fileName: savedResume.fileName,
        template: savedResume.templateStyle,
        atsScore: savedResume.atsScore,
        createdAt: savedResume.createdAt,
      }
    });

  } catch (error) {
    console.error('Error saving builder resume:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save resume'
    }, { status: 500 });
  }
}

/**
 * GET /api/resumes/builder/save
 * Get saved builder resumes for the user
 */
export async function GET(request: NextRequest) {
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

    // Get builder resumes
    const resumes = await prisma.resume.findMany({
      where: {
        userId: user.id,
        isBuilder: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      resumes: resumes.map(resume => ({
        id: resume.id,
        fileName: resume.fileName,
        template: resume.templateStyle,
        atsScore: resume.atsScore,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      }))
    });

  } catch (error) {
    console.error('Error fetching builder resumes:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch resumes'
    }, { status: 500 });
  }
}

