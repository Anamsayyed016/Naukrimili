import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/nextauth-config";

import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const algorithm = searchParams.get("algorithm") || "skills"; // skills, location, experience, hybrid

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        skills: true,
        location: true,
        experience: true,
        locationPreference: true,
        jobTypePreference: true,
        remotePreference: true,
        salaryExpectation: true,
        applications: {
          select: {
            jobId: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get applied job IDs to exclude
    const appliedJobIds = user.applications.map(app => app.jobId);

    let where: any = {
      isActive: true,
      id: { notIn: appliedJobIds }
    };

    let orderBy: any = {};

    // Apply recommendation algorithm
    switch (algorithm) {
      case 'skills':
        if (user.skills && user.skills.length > 0) {
          where.OR = user.skills.map(skill => ({
            skills: { has: skill }
          }));
          orderBy = { createdAt: 'desc' };
        }
        break;

      case 'location':
        if (user.location || user.locationPreference) {
          const location = user.location || user.locationPreference;
          where.location = { contains: location, mode: 'insensitive' };
          orderBy = { createdAt: 'desc' };
        }
        break;

      case 'experience':
        if (user.experience) {
          // Simple experience matching based on keywords
          const experienceKeywords = user.experience.toLowerCase().split(' ');
          where.OR = experienceKeywords.map(keyword => ({
            description: { contains: keyword, mode: 'insensitive' }
          }));
          orderBy = { createdAt: 'desc' };
        }
        break;

      case 'hybrid':
        // Combine multiple factors
        const conditions = [];
        
        // Skills match
        if (user.skills && user.skills.length > 0) {
          conditions.push({
            OR: user.skills.map(skill => ({
              skills: { has: skill }
            }))
          });
        }

        // Location match
        if (user.location || user.locationPreference) {
          const location = user.location || user.locationPreference;
          conditions.push({
            location: { contains: location, mode: 'insensitive' }
          });
        }

        // Job type preference
        if (user.jobTypePreference && user.jobTypePreference.length > 0) {
          conditions.push({
            jobType: { in: user.jobTypePreference }
          });
        }

        // Remote preference
        if (user.remotePreference) {
          conditions.push({
            isRemote: true
          });
        }

        if (conditions.length > 0) {
          where.AND = conditions;
        }
        
        orderBy = { createdAt: 'desc' };
        break;

      default:
        orderBy = { createdAt: 'desc' };
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            website: true
          }
        },
        _count: {
          select: {
            applications: true,
            bookmarks: true
          }
        }
      },
      orderBy,
      take: limit
    });

    // Calculate match scores for each job
    const jobsWithScores = jobs.map(job => {
      let score = 0;
      let reasons = [];

      // Skills match
      if (user.skills && user.skills.length > 0 && job.skills) {
        const matchingSkills = user.skills.filter(skill => 
          job.skills.includes(skill)
        );
        if (matchingSkills.length > 0) {
          score += (matchingSkills.length / user.skills.length) * 40;
          reasons.push(`${matchingSkills.length} skill(s) match`);
        }
      }

      // Location match
      if (user.location && job.location) {
        if (job.location.toLowerCase().includes(user.location.toLowerCase())) {
          score += 30;
          reasons.push('Location match');
        }
      }

      // Job type preference
      if (user.jobTypePreference && user.jobTypePreference.includes(job.jobType)) {
        score += 20;
        reasons.push('Preferred job type');
      }

      // Remote preference
      if (user.remotePreference && job.isRemote) {
        score += 10;
        reasons.push('Remote work available');
      }

      return {
        ...job,
        matchScore: Math.round(score),
        matchReasons: reasons
      };
    });

    // Sort by match score
    jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      success: true,
      data: {
        jobs: jobsWithScores,
        algorithm,
        userProfile: {
          skills: user.skills,
          location: user.location,
          jobTypePreference: user.jobTypePreference,
          remotePreference: user.remotePreference
        }
      }
    });
  } catch (_error) {
    console.error('Error fetching job recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
