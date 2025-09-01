import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const builderResumeSchema = z.object({
  userId: z.string(),
  builderData: z.object({
    personalInfo: z.object({
      fullName: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      location: z.string().optional(),
      linkedin: z.string().optional(),
      summary: z.string().optional(),
    }),
    education: z.array(z.object({
      id: z.string(),
      institution: z.string(),
      degree: z.string(),
      field: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      gpa: z.string().optional(),
      description: z.string().optional(),
    })).optional(),
    experience: z.array(z.object({
      id: z.string(),
      company: z.string(),
      position: z.string(),
      location: z.string().optional(),
      startDate: z.string(),
      endDate: z.string(),
      current: z.boolean().optional(),
      description: z.string().optional(),
      achievements: z.array(z.string()).optional(),
    })).optional(),
    skills: z.array(z.object({
      id: z.string(),
      name: z.string(),
      level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    })).optional(),
    projects: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      technologies: z.array(z.string()).optional(),
      url: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })).optional(),
    certifications: z.array(z.object({
      id: z.string(),
      name: z.string(),
      issuer: z.string(),
      date: z.string(),
      url: z.string().optional(),
    })).optional(),
  }),
  templateStyle: z.string().optional(),
  colorScheme: z.string().optional(),
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
