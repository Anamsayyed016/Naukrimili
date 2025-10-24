import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Check if user is an employer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({
        success: false,
        error: 'Employer access required'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const skills = searchParams.get('skills') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build search criteria
    const where: any = {
      isActive: true,
      user: {
        role: 'jobseeker',
        isActive: true
      }
    };

    // Search in parsed data
    if (query || location || skills || experienceLevel) {
      where.parsedData = {};
      
      if (query) {
        where.parsedData.OR = [
          { fullName: { contains: query, mode: 'insensitive' } },
          { summary: { contains: query, mode: 'insensitive' } },
          { jobTitle: { contains: query, mode: 'insensitive' } }
        ];
      }
      
      if (location) {
        where.parsedData.location = { contains: location, mode: 'insensitive' };
      }
      
      if (skills) {
        const skillArray = skills.split(',').map(s => s.trim());
        where.parsedData.skills = { hasSome: skillArray };
      }
      
      if (experienceLevel) {
        where.parsedData.experienceLevel = { contains: experienceLevel, mode: 'insensitive' };
      }
    }

    const [candidates, total] = await Promise.all([
      prisma.resume.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
        lastName: true,
              email: true,
              createdAt: true
            }
          },
          applications: {
            select: {
              id: true,
              status: true,
              appliedAt: true,
              job: {
                select: {
                  id: true,
                  title: true,
                  company: true
                }
              }
            },
            orderBy: { appliedAt: 'desc' },
            take: 5
          }
        }
      }),
      prisma.resume.count({ where })
    ]);

    // Format candidates data
    const formattedCandidates = candidates.map(candidate => ({
      id: candidate.id,
      userId: candidate.userId,
      fileName: candidate.fileName,
      atsScore: candidate.atsScore,
      updatedAt: candidate.updatedAt,
      user: candidate.user,
      profile: candidate.parsedData,
      recentApplications: candidate.applications,
      isActive: candidate.isActive
    }));

    return NextResponse.json({
      success: true,
      data: {
        candidates: formattedCandidates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch candidates'
    }, { status: 500 });
  }
}
