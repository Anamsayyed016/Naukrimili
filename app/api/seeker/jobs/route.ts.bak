import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { calculateMatchScore } from '@/lib/jobMatching';
import { calculateDistance } from '@/lib/geoUtils';

export async function GET() {
  try {
    // Get authenticated user's session
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get seeker's profile with skills and preferences
    const seekerProfile = await prisma.seekerProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        skills: true,
        preferences: true,
        currentLocation: true,
      },
    });

    if (!seekerProfile) {
      return NextResponse.json(
        { error: 'Seeker profile not found' },
        { status: 404 }
      );
    }

    // Fetch relevant jobs based on seeker's preferences
    const jobs = await prisma.job.findMany({
      where: {
        status: 'ACTIVE',
        // Basic filtering based on preferences
        salaryMax: {
          gte: seekerProfile.preferences?.expectedSalaryMin,
        },
        salaryMin: {
          lte: seekerProfile.preferences?.expectedSalaryMax,
        },
        jobType: {
          in: seekerProfile.preferences?.preferredJobTypes,
        },
      },
      include: {
        company: {
          select: {
            name: true,
            location: true,
          },
        },
        requiredSkills: true,
      },
      take: 20, // Limit results
    });

    // Process and enhance job results with match scores and distance
    const enhancedJobs = jobs.map((job: any) => {
      const matchScore = calculateMatchScore({
        jobSkills: job.requiredSkills,
        seekerSkills: seekerProfile.skills,
        jobPreferences: {
          experienceRequired: job.experienceRequired,
          salaryRange: [job.salaryMin, job.salaryMax],
          location: job.location,
        },
        seekerPreferences: seekerProfile.preferences,
      });

      const distance = calculateDistance(
        seekerProfile.currentLocation,
        job.company.location
      );

      return {
        id: job.id,
        title: job.title,
        company: job.company.name,
        matchScore: Math.round(matchScore),
        salary: `₹${(job.salaryMin / 100000).toFixed(0)}-${(job.salaryMax / 100000).toFixed(0)} LPA`,
        location: `${job.company.location.city} (${distance}km from you)`,
        postedAt: job.createdAt,
      };
    });

    // Sort by match score descending
    enhancedJobs.sort((a: any, b: any) => b.matchScore - a.matchScore);

    return NextResponse.json({ jobs: enhancedJobs });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
