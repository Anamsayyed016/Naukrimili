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

    // Build search criteria - use both user fields and parsed data
    const where: any = {
      isActive: true,
      user: {
        role: 'jobseeker',
        isActive: true
      }
    };

    // Add filters for query search
    if (query || location || skills || experienceLevel) {
      where.OR = [];
      
      // Search in user fields (more reliable)
      if (query) {
        where.OR.push(
          { user: { firstName: { contains: query, mode: 'insensitive' } } },
          { user: { lastName: { contains: query, mode: 'insensitive' } } },
          { user: { email: { contains: query, mode: 'insensitive' } } },
          { user: { bio: { contains: query, mode: 'insensitive' } } },
          { fileName: { contains: query, mode: 'insensitive' } }
        );
      }
      
      // Location filter in user field
      if (location) {
        where.user.location = { contains: location, mode: 'insensitive' };
      }
      
      // Skills search in user field
      if (skills) {
        const skillArray = skills.split(',').map(s => s.trim().toLowerCase());
        where.user.skills = {
          array_contains: skillArray
        };
      }
      
      // Experience level filter in user field
      if (experienceLevel) {
        where.user.experience = { contains: experienceLevel, mode: 'insensitive' };
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
              phone: true,
              location: true,
              bio: true,
              skills: true,
              experience: true,
              education: true,
              profilePicture: true,
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

    // Format candidates data with complete information
    const formattedCandidates = candidates.map(candidate => {
      const userName = candidate.user.firstName && candidate.user.lastName
        ? `${candidate.user.firstName} ${candidate.user.lastName}`.trim()
        : candidate.user.firstName || candidate.user.email || 'Unknown';
      
      return {
        id: candidate.id,
        userId: candidate.userId,
        fileName: candidate.fileName,
        fileUrl: candidate.fileUrl,
        fileSize: candidate.fileSize,
        atsScore: candidate.atsScore,
        updatedAt: candidate.updatedAt,
        createdAt: candidate.createdAt,
        user: {
          ...candidate.user,
          fullName: userName
        },
        profile: candidate.parsedData,
        recentApplications: candidate.applications,
        isActive: candidate.isActive
      };
    });

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
