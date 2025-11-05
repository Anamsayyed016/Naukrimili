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
    const algorithm = searchParams.get("algorithm") || "hybrid"; // Default to hybrid for better results

    console.log(`🎯 Fetching job recommendations for user ${session.user.id} using ${algorithm} algorithm`);

    // Get user profile with resume data
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
        bio: true,
        education: true,
        applications: {
          select: {
            jobId: true
          }
        },
        resumes: {
          where: { isActive: true },
          select: {
            skills: true,
            experience: true,
            education: true,
            summary: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // CRITICAL FIX: Parse skills from JSON string
    let userSkills = [];
    try {
      userSkills = typeof user.skills === 'string' 
        ? JSON.parse(user.skills) 
        : Array.isArray(user.skills) 
        ? user.skills 
        : [];
    } catch (e) {
      userSkills = [];
    }

    console.log(`📄 User profile:`, {
      hasSkills: userSkills.length > 0,
      hasLocation: !!user.location,
      hasResume: user.resumes.length > 0,
      skillsCount: userSkills.length,
      resumeSkills: user.resumes[0]?.skills?.length || 0
    });

    // Get applied job IDs to exclude
    const appliedJobIds = user.applications.map(app => app.jobId);
    
    // ENHANCED: Combine user skills with resume skills
    let allSkills = [...userSkills];
    if (user.resumes.length > 0 && user.resumes[0].skills) {
      allSkills = [...new Set([...allSkills, ...(user.resumes[0].skills || [])])];
    }
    
    // ENHANCED: Get location from profile or resume
    const userLocation = user.location || user.locationPreference;

    let where: any = {
      isActive: true,
      id: { notIn: appliedJobIds }
    };

    let orderBy: any = {};

    // ENHANCED: Apply recommendation algorithm using combined profile + resume data
    switch (algorithm) {
      case 'skills':
        if (allSkills.length > 0) {
          where.OR = allSkills.map(skill => ({
            OR: [
              { skills: { contains: skill, mode: 'insensitive' } },
              { title: { contains: skill, mode: 'insensitive' } },
              { description: { contains: skill, mode: 'insensitive' } }
            ]
          }));
          orderBy = { createdAt: 'desc' };
        }
        break;

      case 'location':
        if (userLocation) {
          where.OR = [
            { location: { contains: userLocation, mode: 'insensitive' } },
            { isRemote: true } // Also include remote jobs
          ];
          orderBy = { createdAt: 'desc' };
        }
        break;

      case 'experience':
        if (user.experience || (user.resumes[0]?.experience)) {
          const experienceText = user.experience || user.resumes[0]?.experience || '';
          const experienceKeywords = experienceText.toLowerCase().split(' ').filter(w => w.length > 3);
          if (experienceKeywords.length > 0) {
            where.OR = experienceKeywords.map(keyword => ({
              OR: [
                { title: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } }
              ]
            }));
          }
          orderBy = { createdAt: 'desc' };
        }
        break;

      case 'hybrid':
      default:
        // ENHANCED: Combine multiple factors with broader matching
        const orConditions = [];
        
        // Skills match - Check title, description, and skills field
        if (allSkills.length > 0) {
          allSkills.forEach(skill => {
            orConditions.push({
              OR: [
                { skills: { contains: skill, mode: 'insensitive' } },
                { title: { contains: skill, mode: 'insensitive' } },
                { description: { contains: skill, mode: 'insensitive' } }
              ]
            });
          });
        }

        // Location match - Flexible matching
        if (userLocation) {
          orConditions.push({
            OR: [
              { location: { contains: userLocation, mode: 'insensitive' } },
              { isRemote: true },
              { isHybrid: true }
            ]
          });
        }

        // Job type preference
        let userJobTypes = [];
        try {
          userJobTypes = typeof user.jobTypePreference === 'string' 
            ? (user.jobTypePreference ? JSON.parse(user.jobTypePreference) : [])
            : (Array.isArray(user.jobTypePreference) ? user.jobTypePreference : []);
        } catch (e) {
          userJobTypes = [];
        }
        
        if (userJobTypes.length > 0) {
          orConditions.push({
            jobType: { in: userJobTypes, mode: 'insensitive' }
          });
        }

        // Remote preference
        if (user.remotePreference) {
          orConditions.push({ isRemote: true });
        }

        // If we have conditions, use OR to get more results
        if (orConditions.length > 0) {
          where.OR = orConditions;
        }
        
        orderBy = { createdAt: 'desc' };
        break;
    }

    let jobs = await prisma.job.findMany({
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

    console.log(`📊 Found ${jobs.length} jobs matching criteria`);

    // FALLBACK: If no jobs found, get popular/recent jobs
    if (jobs.length === 0) {
      console.log(`🔄 No matching jobs found, fetching popular jobs as fallback...`);
      
      jobs = await prisma.job.findMany({
        where: {
          isActive: true,
          id: { notIn: appliedJobIds }
        },
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
        orderBy: [
          { isFeatured: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      });
      
      console.log(`✅ Fallback: Returning ${jobs.length} popular jobs`);
    }

    // Calculate match scores for each job
    const jobsWithScores = jobs.map(job => {
      let score = 0;
      let reasons = [];

      // ENHANCED: Skills match (check both user skills and resume skills)
      if (allSkills.length > 0 && job.skills) {
        const jobSkillsStr = typeof job.skills === 'string' ? job.skills.toLowerCase() : JSON.stringify(job.skills).toLowerCase();
        const matchingSkills = allSkills.filter(skill => 
          jobSkillsStr.includes(skill.toLowerCase())
        );
        if (matchingSkills.length > 0) {
          score += (matchingSkills.length / allSkills.length) * 40;
          reasons.push(`${matchingSkills.length} skill(s) match`);
        }
      }

      // Skills in title/description
      if (allSkills.length > 0) {
        const titleAndDesc = `${job.title} ${job.description}`.toLowerCase();
        const titleMatches = allSkills.filter(skill => titleAndDesc.includes(skill.toLowerCase())).length;
        if (titleMatches > 0 && !reasons.includes(`${titleMatches} skill(s) match`)) {
          score += (titleMatches / allSkills.length) * 30;
          reasons.push(`Skills in job description`);
        }
      }

      // Location match
      if (userLocation && job.location) {
        if (job.location.toLowerCase().includes(userLocation.toLowerCase())) {
          score += 20;
          reasons.push('Location match');
        }
      }

      // Remote work preference
      if (user.remotePreference && job.isRemote) {
        score += 15;
        reasons.push('Remote work available');
      }

      // Job type preference
      let userJobTypesForScore = [];
      try {
        userJobTypesForScore = typeof user.jobTypePreference === 'string' 
          ? (user.jobTypePreference ? JSON.parse(user.jobTypePreference) : [])
          : (Array.isArray(user.jobTypePreference) ? user.jobTypePreference : []);
      } catch (e) {
        userJobTypesForScore = [];
      }
      
      if (userJobTypesForScore.length > 0) {
        if (userJobTypesForScore.some(pref => job.jobType?.toLowerCase().includes(pref.toLowerCase()))) {
          score += 15;
          reasons.push('Preferred job type');
        }
      }

      // Recent posting bonus
      const daysSincePosted = (Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePosted <= 7) {
        score += 10;
        reasons.push('Recently posted');
      }

      // If no specific reasons, mark as popular
      if (reasons.length === 0) {
        reasons.push('Popular job');
      }

      return {
        ...job,
        matchScore: Math.min(100, Math.round(score)), // Cap at 100
        matchReasons: reasons
      };
    });

    // Sort by match score
    jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);

    console.log(`✅ Returning ${jobsWithScores.length} job recommendations (scores: ${jobsWithScores.map(j => j.matchScore).join(', ')})`);

    return NextResponse.json({
      success: true,
        data: {
          jobs: jobsWithScores,
          algorithm,
          userProfile: {
            skills: allSkills,
            resumeSkills: user.resumes[0]?.skills || [],
            location: userLocation,
            jobTypePreference: typeof user.jobTypePreference === 'string' 
              ? (user.jobTypePreference ? JSON.parse(user.jobTypePreference) : [])
              : (Array.isArray(user.jobTypePreference) ? user.jobTypePreference : []),
            remotePreference: user.remotePreference,
            hasResume: user.resumes.length > 0
          },
        metadata: {
          totalMatched: jobsWithScores.length,
          averageMatchScore: jobsWithScores.length > 0 
            ? Math.round(jobsWithScores.reduce((sum, j) => sum + j.matchScore, 0) / jobsWithScores.length)
            : 0
        }
      }
    });
  } catch (_error) {
    console.error('Error fetching job recommendations:', _error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
