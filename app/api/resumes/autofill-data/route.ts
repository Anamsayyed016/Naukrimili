import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    console.log('🔍 Checking for existing autofill data for user:', session.user.email);

    // Get user's most recent resume with AI-extracted data
    const resume = await prisma.resume.findFirst({
      where: {
        user: { email: session.user.email },
        parsedData: { not: null },
        isActive: true
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        parsedData: true,
        atsScore: true,
        fileName: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!resume || !resume.parsedData) {
      console.log('❌ No resume data found for autofill');
      return NextResponse.json({
        success: false,
        error: 'No resume data found for autofill'
      }, { status: 404 });
    }

    console.log('✅ Found existing autofill data:', {
      resumeId: resume.id,
      fileName: resume.fileName,
      hasData: !!resume.parsedData,
      lastUpdated: resume.updatedAt
    });

    return NextResponse.json({
      success: true,
      profile: resume.parsedData,
      resumeId: resume.id,
      fileName: resume.fileName,
      atsScore: resume.atsScore,
      lastUpdated: resume.updatedAt,
      message: 'Previous resume data found and loaded'
    });

  } catch (error) {
    console.error('❌ Autofill data retrieval error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';