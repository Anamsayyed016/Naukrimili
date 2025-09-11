import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Simplified schema for backward compatibility
const builderResumeSchema = z.object({
  userId: z.string(),
  builderData: z.any(), // Accept any structure for now
  templateStyle: z.string().optional(),
  colorScheme: z.string().optional(),
  fontFamily: z.string().optional(),
  atsScore: z.number().min(0).max(100).optional(),
  fileName: z.string(),
  isBuilder: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = builderResumeSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Create resume with builder data
    const resume = await prisma.resume.create({
      data: {
        userId: validatedData.userId,
        fileName: validatedData.fileName,
        fileUrl: '', // No file URL for builder resumes
        fileSize: null,
        mimeType: null,
        parsedData: validatedData.builderData, // Store builder data in parsedData
        atsScore: validatedData.atsScore || 0,
        isActive: true,
        isBuilder: true,
        templateStyle: validatedData.templateStyle || 'modern',
        colorScheme: validatedData.colorScheme || 'blue',
        builderData: validatedData.builderData,
      }
    });

    return NextResponse.json({
      success: true,
      resume,
      message: 'Resume created successfully'
    });

  } catch (error) {
    console.error('Error creating builder resume:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Get builder resumes for user
    const resumes = await prisma.resume.findMany({
      where: {
        userId,
        isBuilder: true,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      resumes,
      count: resumes.length
    });

  } catch (error) {
    console.error('Error fetching builder resumes:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
