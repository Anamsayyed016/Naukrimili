import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing job seeker recommendations API...');
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5");
    const algorithm = searchParams.get("algorithm") || "skills";

    // Sample user profile for testing
    const sampleUser = {
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
      location: 'Mumbai',
      experience: 'Software Engineer with 3 years experience',
      jobTypePreference: ['full-time', 'contract'],
      remotePreference: true,
      salaryExpectation: 800000
    };

    console.log('👤 Using sample user profile:', sampleUser);

    let where: any = {
      isActive: true
    };

    let orderBy: any = { createdAt: 'desc' };

    // Apply recommendation algorithm
    switch (algorithm) {
      case 'skills':
        if (sampleUser.skills && sampleUser.skills.length > 0) {
          where.OR = sampleUser.skills.map(skill => ({
            skills: { contains: skill, mode: 'insensitive' }
          }));
        }
        break;

      case 'location':
        where.location = { contains: sampleUser.location, mode: 'insensitive' };
        break;

      case 'hybrid':
        const conditions = [];
        
        // Skills match
        if (sampleUser.skills && sampleUser.skills.length > 0) {
          conditions.push({
            OR: sampleUser.skills.map(skill => ({
              skills: { contains: skill, mode: 'insensitive' }
            }))
          });
        }

        // Location match
        conditions.push({
          location: { contains: sampleUser.location, mode: 'insensitive' }
        });

        // Remote preference
        if (sampleUser.remotePreference) {
          conditions.push({
            isRemote: true
          });
        }

        if (conditions.length > 0) {
          where.AND = conditions;
        }
        break;

      default:
        // Default: get recent jobs
        break;
    }

    console.log('🔍 Query conditions:', where);

    const jobs = await prisma.job.findMany({
      where,
      include: {
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

    console.log(`✅ Found ${jobs.length} jobs`);

    // Calculate match scores for each job
    const jobsWithScores = jobs.map(job => {
      let score = 0;
      let reasons = [];

      // Skills match
      if (sampleUser.skills && sampleUser.skills.length > 0 && job.skills) {
        const jobSkills = typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills;
        const matchingSkills = sampleUser.skills.filter(skill => 
          jobSkills.some((jobSkill: string) => 
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
        if (matchingSkills.length > 0) {
          score += (matchingSkills.length / sampleUser.skills.length) * 40;
          reasons.push(`${matchingSkills.length} skill(s) match: ${matchingSkills.join(', ')}`);
        }
      }

      // Location match
      if (sampleUser.location && job.location) {
        if (job.location.toLowerCase().includes(sampleUser.location.toLowerCase())) {
          score += 30;
          reasons.push('Location match');
        }
      }

      // Job type preference
      if (sampleUser.jobTypePreference && sampleUser.jobTypePreference.includes(job.jobType)) {
        score += 20;
        reasons.push('Preferred job type');
      }

      // Remote preference
      if (sampleUser.remotePreference && job.isRemote) {
        score += 10;
        reasons.push('Remote work available');
      }

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        salary: job.salary,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        isRemote: job.isRemote,
        isHybrid: job.isHybrid,
        description: job.description,
        skills: job.skills,
        postedAt: job.postedAt,
        createdAt: job.createdAt,
        matchScore: Math.round(score),
        matchReasons: reasons,
        applicationsCount: job._count.applications,
        bookmarksCount: job._count.bookmarks
      };
    });

    // Sort by match score
    jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);

    console.log('📊 Jobs with scores:', jobsWithScores.map(j => ({ title: j.title, score: j.matchScore, reasons: j.matchReasons })));

    return NextResponse.json({
      success: true,
      data: {
        jobs: jobsWithScores,
        algorithm,
        sampleUserProfile: {
          skills: sampleUser.skills,
          location: sampleUser.location,
          jobTypePreference: sampleUser.jobTypePreference,
          remotePreference: sampleUser.remotePreference
        },
        totalJobs: jobsWithScores.length,
        averageScore: jobsWithScores.length > 0 ? 
          Math.round(jobsWithScores.reduce((sum, job) => sum + job.matchScore, 0) / jobsWithScores.length) : 0
      }
    });

  } catch (error) {
    console.error('❌ Error in test recommendations API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch test recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
