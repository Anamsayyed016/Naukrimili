import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUserId = parseInt(session.user.id);
    const requestData = await request.json();
    const { targetRole, experienceLevel, industryType, skills, education } = requestData;

    // Validate required fields
    if (!targetRole || !experienceLevel || !industryType) {
      return NextResponse.json({
        error: 'Missing required fields: targetRole, experienceLevel, industryType'
      }, { status: 400 });
    }

    // Generate resume content based on parameters
    const resumeContent = await generateResumeContent({
      targetRole,
      experienceLevel,
      industryType,
      skills: skills || [],
      education: education || []
    });

    // Save to database
    const resume = await prisma.resume.create({
      data: {
        userId: authUserId,
        title: `${targetRole} Resume`,
        content: resumeContent,
        targetRole,
        experienceLevel,
        industryType,
        skills: skills || [],
        education: education || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Resume generated successfully',
      resume: {
        id: resume.id,
        title: resume.title,
        targetRole: resume.targetRole,
        experienceLevel: resume.experienceLevel,
        industryType: resume.industryType
      }
    });

  } catch (error: any) {
    console.error('Resume generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    );
  }
}

async function generateResumeContent(params: any) {
  const { targetRole, experienceLevel, industryType, skills, education } = params;
  
  // Mock resume generation - replace with actual AI generation
  return {
    summary: `Experienced ${targetRole} with ${experienceLevel} level expertise in ${industryType}.`,
    experience: [
      {
        title: targetRole,
        company: 'Sample Company',
        duration: '2+ years',
        description: `Led ${industryType} projects and initiatives.`
      }
    ],
    skills: skills.length > 0 ? skills : ['Project Management', 'Team Leadership', 'Problem Solving'],
    education: education.length > 0 ? education : ['Bachelor\'s Degree in Computer Science']
  };
}
