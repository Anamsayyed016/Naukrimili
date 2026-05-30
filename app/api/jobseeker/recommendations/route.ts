import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/nextauth-config";

import { prisma } from "@/lib/prisma";

/** Job.company is a string scalar; companyRelation is the Prisma relation. */
const JOB_RECOMMENDATION_INCLUDE = {
  companyRelation: {
    select: {
      id: true,
      name: true,
      logo: true,
      website: true,
    },
  },
  _count: {
    select: {
      applications: true,
      bookmarks: true,
    },
  },
} as const;

export async function GET(request: NextRequest) {
  try {
    console.log('🔔 RECOMMENDATIONS API CALLED - checking authentication...');
    const session = await auth();
    console.log('🔐 Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id || 'NO USER ID',
      userEmail: session?.user?.email || 'NO EMAIL'
    });
    
    if (!session?.user?.id) {
      console.error('❌ AUTH FAILED: No session or user ID');
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const algorithm = searchParams.get("algorithm") || "hybrid"; // Default to hybrid for better results

    console.log(`🎯 Fetching job recommendations for user ${session.user.id} using ${algorithm} algorithm`);

    // Get user profile with resume data - with error handling
    let user;
    try {
      user = await prisma.user.findUnique({
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
              parsedData: true,
              atsScore: true
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });
    } catch (dbError) {
      console.error('❌ Database error fetching user:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database connection error. Please try again.' },
        { status: 500 }
      );
    }

    if (!user) {
      console.log('⚠️ User not found in database:', session.user.id);
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // CRITICAL FIX: Parse skills from JSON string
    let userSkills = [];
    try {
      console.log(`📝 Raw user.skills from DB:`, typeof user.skills, user.skills);
      userSkills = typeof user.skills === 'string' 
        ? JSON.parse(user.skills) 
        : Array.isArray(user.skills) 
        ? user.skills 
        : [];
      console.log(`✅ Parsed userSkills:`, userSkills);
    } catch (e) {
      console.error('❌ Error parsing skills:', e);
      userSkills = [];
    }

    // Extract skills from resume parsedData
    let resumeSkills: string[] = [];
    if (user.resumes.length > 0 && user.resumes[0].parsedData) {
      const parsedData = user.resumes[0].parsedData as any;
      resumeSkills = parsedData?.skills || parsedData?.extractedSkills || [];
    }

    console.log(`📄 User profile:`, {
      hasSkills: userSkills.length > 0,
      hasLocation: !!user.location,
      hasResume: user.resumes.length > 0,
      skillsCount: userSkills.length,
      resumeSkills: resumeSkills.length,
      userSkillsList: userSkills.slice(0, 5),
      hasLocationPreference: !!user.locationPreference,
      hasJobTypePreference: !!user.jobTypePreference,
      remotePreference: user.remotePreference
    });

    // Get applied job IDs (but don't exclude them - just mark them)
    const appliedJobIds = user.applications.map(app => app.jobId);
    
    // ENHANCED: Combine user skills with resume skills
    let allSkills = [...userSkills];
    if (resumeSkills.length > 0) {
      allSkills = [...new Set([...allSkills, ...resumeSkills])];
    }
    
    // ENHANCED: Get location from profile or resume
    const userLocation = user.location || user.locationPreference;

    // First check: Do we have ANY jobs in the database?
    const totalJobsCount = await prisma.job.count();
    const activeJobsCount = await prisma.job.count({ where: { isActive: true } });
    console.log(`📊 Database check: Total jobs: ${totalJobsCount}, Active jobs: ${activeJobsCount}`);
    
    if (totalJobsCount === 0) {
      console.error('❌ CRITICAL: No jobs in database at all!');
      return NextResponse.json({
        success: true,
        data: {
          jobs: [],
          algorithm,
          userProfile: {
            skills: allSkills,
            resumeSkills: resumeSkills,
            location: userLocation || null,
            jobTypePreference: [],
            remotePreference: user.remotePreference || false,
            hasResume: user.resumes.length > 0
          },
          metadata: {
            totalMatched: 0,
            averageMatchScore: 0
          },
          message: 'No jobs available yet. Please check back later or contact admin to add jobs.'
        }
      });
    }
    
    if (activeJobsCount === 0) {
      console.warn('⚠️ WARNING: No active jobs! Total jobs exist but all are inactive.');
    }

    // CRITICAL FIX: Don't exclude applied jobs - show all active jobs
    let where: any = {
      isActive: true
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
          console.log(`🔍 Skills algorithm: Searching for ${allSkills.length} skills`);
        } else {
          console.warn('⚠️ Skills algorithm but no skills available, falling back to all jobs');
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
        if (user.experience) {
          const experienceText = user.experience || '';
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
        
        console.log(`🎯 Hybrid algorithm starting with:`, {
          skillsCount: allSkills.length,
          location: userLocation,
          hasJobTypePrefs: !!user.jobTypePreference,
          remotePreference: user.remotePreference
        });
        
        // Skills match - Check title, description, and skills field
        if (allSkills.length > 0) {
          console.log(`🔍 Adding skills to search: ${allSkills.join(', ')}`);
          allSkills.forEach(skill => {
            orConditions.push({
              OR: [
                { skills: { contains: skill, mode: 'insensitive' } },
                { title: { contains: skill, mode: 'insensitive' } },
                { description: { contains: skill, mode: 'insensitive' } }
              ]
            });
          });
        } else {
          console.warn('⚠️ No skills available for matching');
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
            jobType: { in: userJobTypes },
          });
        }

        // Remote preference
        if (user.remotePreference) {
          orConditions.push({ isRemote: true });
        }

        // If we have conditions, use OR to get more results
        if (orConditions.length > 0) {
          where.OR = orConditions;
          console.log(`✅ Added ${orConditions.length} OR conditions to search`);
        } else {
          console.warn('⚠️ CRITICAL: No OR conditions! Will search ALL active jobs.');
        }
        
        orderBy = { createdAt: 'desc' };
        break;
    }
    
    console.log(`📝 Final where clause:`, JSON.stringify(where, null, 2));
    console.log(`📝 Final orderBy:`, JSON.stringify(orderBy, null, 2));

    let jobs;
    try {
      jobs = await prisma.job.findMany({
        where,
        include: JOB_RECOMMENDATION_INCLUDE,
        orderBy,
        take: limit
      });
    } catch (dbError) {
      console.error('❌ Database error fetching jobs:', dbError);
      // Return empty array instead of crashing
      jobs = [];
    }

    console.log(`📊 Found ${jobs.length} jobs matching criteria`);
    console.log(`🔍 Search where clause:`, JSON.stringify(where, null, 2));
    console.log(`📋 Combined skills used for matching: ${allSkills.slice(0, 10).join(', ')}...`);

    // ENHANCED FALLBACK: If no jobs found, get ALL active jobs
    if (jobs.length === 0) {
      console.log(`🔄 No matching jobs found, fetching all active jobs as fallback...`);
      
      try {
        jobs = await prisma.job.findMany({
          where: {
            isActive: true
          },
          include: JOB_RECOMMENDATION_INCLUDE,
          orderBy: [
            { isFeatured: 'desc' },
            { createdAt: 'desc' }
          ],
          take: limit * 2 // Get more jobs for better selection
        });
        
        console.log(`✅ Fallback: Returning ${jobs.length} active jobs`);
      } catch (fallbackError) {
        console.error('❌ Fallback query failed:', fallbackError);
        jobs = [];
      }
    }
    
    // CRITICAL: Always ensure we have jobs to show
    if (jobs.length === 0) {
      console.log(`⚠️ Still no jobs found, getting ANY jobs from database...`);
      try {
        jobs = await prisma.job.findMany({
          include: JOB_RECOMMENDATION_INCLUDE,
          orderBy: { createdAt: 'desc' },
          take: limit
        });
        console.log(`✅ Emergency fallback: Returning ${jobs.length} total jobs`);
      } catch (emergencyError) {
        console.error('❌ Emergency fallback failed:', emergencyError);
        // Return empty array gracefully
        jobs = [];
      }
    }
    
    // If still no jobs after all fallbacks, return graceful response
    if (jobs.length === 0) {
      console.log(`ℹ️ No jobs available in database`);
      return NextResponse.json({
        success: true,
        data: {
          jobs: [],
          algorithm,
          userProfile: {
            skills: [],
            resumeSkills: [],
            location: userLocation || null,
            jobTypePreference: [],
            remotePreference: user.remotePreference || false,
            hasResume: user.resumes.length > 0
          },
          metadata: {
            totalMatched: 0,
            averageMatchScore: 0
          },
          message: 'No jobs available at the moment. Please check back later.'
        }
      });
    }

    // Calculate match scores for each job
    const jobsWithScores = jobs.map(job => {
      let score = 0;
      let reasons = [];

      // Mark if already applied
      const alreadyApplied = appliedJobIds.includes(job.id);
      if (alreadyApplied) {
        reasons.push('Already applied');
      }

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

      const relation = job.companyRelation as { name?: string; logo?: string } | null;

      return {
        ...job,
        company: job.company || relation?.name || 'Company',
        companyLogo: job.companyLogo || relation?.logo || null,
        matchScore: Math.min(100, Math.round(score)), // Cap at 100
        matchReasons: reasons.length > 0 ? reasons : ['New opportunity'],
        alreadyApplied
      };
    });

    // Sort by match score (prioritize not-applied jobs)
    jobsWithScores.sort((a, b) => {
      // First, prioritize jobs not applied to
      if (a.alreadyApplied && !b.alreadyApplied) return 1;
      if (!a.alreadyApplied && b.alreadyApplied) return -1;
      // Then sort by match score
      return b.matchScore - a.matchScore;
    });

    console.log(`✅ Returning ${jobsWithScores.length} job recommendations (scores: ${jobsWithScores.map(j => j.matchScore).join(', ')})`);
    console.log(`📊 Applied jobs: ${jobsWithScores.filter(j => j.alreadyApplied).length}, New jobs: ${jobsWithScores.filter(j => !j.alreadyApplied).length}`);

    return NextResponse.json({
      success: true,
      data: {
        jobs: jobsWithScores,
        algorithm,
        userProfile: {
          skills: allSkills,
          resumeSkills: resumeSkills,
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
    const error = _error as Error;
    console.error('❌ Error fetching job recommendations:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch recommendations',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
