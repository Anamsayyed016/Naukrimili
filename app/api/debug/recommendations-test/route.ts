import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    steps: [],
    errors: []
  };

  try {
    // Step 1: Check session
    debugInfo.steps.push("1. Checking authentication...");
    const session = await auth();
    
    debugInfo.session = {
      exists: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id || null,
      userEmail: session?.user?.email || null,
      userRole: session?.user?.role || null
    };

    if (!session?.user?.id) {
      debugInfo.errors.push("❌ NO SESSION - User not authenticated");
      return NextResponse.json({ success: false, debug: debugInfo }, { status: 401 });
    }

    debugInfo.steps.push("✅ Authentication passed");

    // Step 2: Check user profile
    debugInfo.steps.push("2. Fetching user profile...");
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        skills: true,
        location: true,
        locationPreference: true,
        experience: true,
        jobTypePreference: true,
        remotePreference: true,
        bio: true,
        resumes: {
          select: {
            id: true,
            fileName: true,
            parsedData: true,
            isActive: true
          }
        }
      }
    });

    if (!user) {
      debugInfo.errors.push("❌ USER NOT FOUND in database");
      return NextResponse.json({ success: false, debug: debugInfo }, { status: 404 });
    }

    debugInfo.steps.push("✅ User profile found");
    debugInfo.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      hasSkills: !!user.skills,
      skillsValue: user.skills,
      hasLocation: !!user.location,
      locationValue: user.location,
      hasLocationPreference: !!user.locationPreference,
      locationPreferenceValue: user.locationPreference,
      hasExperience: !!user.experience,
      experienceValue: user.experience,
      hasResumes: user.resumes.length > 0,
      resumeCount: user.resumes.length,
      jobTypePreference: user.jobTypePreference,
      remotePreference: user.remotePreference,
      bio: user.bio
    };

    // Step 3: Parse skills
    debugInfo.steps.push("3. Parsing user skills...");
    let userSkills: string[] = [];
    try {
      if (typeof user.skills === 'string') {
        userSkills = user.skills ? JSON.parse(user.skills) : [];
      } else if (Array.isArray(user.skills)) {
        userSkills = user.skills;
      }
    } catch (e) {
      debugInfo.errors.push("⚠️ Failed to parse user.skills");
    }

    debugInfo.parsedSkills = userSkills;

    // Step 3b: Parse resume skills
    let resumeSkills: string[] = [];
    if (user.resumes.length > 0 && user.resumes[0].parsedData) {
      const parsedData = user.resumes[0].parsedData as any;
      resumeSkills = parsedData?.skills || parsedData?.extractedSkills || [];
    }
    
    debugInfo.resumeData = {
      hasResumes: user.resumes.length > 0,
      resumeSkills: resumeSkills,
      resumeSkillsCount: resumeSkills.length,
      parsedDataExists: user.resumes.length > 0 && !!user.resumes[0].parsedData
    };

    const allSkills = [...new Set([...userSkills, ...resumeSkills])];
    debugInfo.combinedSkills = {
      userSkills: userSkills,
      resumeSkills: resumeSkills,
      allSkills: allSkills,
      totalCount: allSkills.length
    };

    // Step 4: Check database jobs
    debugInfo.steps.push("4. Checking database jobs...");
    const totalJobs = await prisma.job.count();
    const activeJobs = await prisma.job.count({ where: { isActive: true } });
    
    debugInfo.database = {
      totalJobs,
      activeJobs,
      hasJobs: totalJobs > 0,
      hasActiveJobs: activeJobs > 0
    };

    if (totalJobs === 0) {
      debugInfo.errors.push("❌ DATABASE IS EMPTY - No jobs exist");
    } else if (activeJobs === 0) {
      debugInfo.errors.push("⚠️ No active jobs (all jobs are inactive)");
    } else {
      debugInfo.steps.push(`✅ Found ${activeJobs} active jobs`);
    }

    // Step 5: Test a simple query
    debugInfo.steps.push("5. Testing simple query...");
    const testJobs = await prisma.job.findMany({
      where: { isActive: true },
      take: 3,
      select: {
        id: true,
        title: true,
        location: true,
        skills: true,
        isActive: true
      }
    });

    debugInfo.testQuery = {
      foundJobs: testJobs.length,
      sampleJobs: testJobs.map(j => ({
        id: j.id,
        title: j.title,
        location: j.location,
        skills: j.skills?.substring(0, 100)
      }))
    };

    // Step 6: Test recommendations query
    if (allSkills.length > 0) {
      debugInfo.steps.push("6. Testing recommendations query with skills...");
      
      const orConditions = allSkills.map(skill => ({
        OR: [
          { skills: { contains: skill, mode: 'insensitive' as any } },
          { title: { contains: skill, mode: 'insensitive' as any } },
          { description: { contains: skill, mode: 'insensitive' as any } }
        ]
      }));

      const matchedJobs = await prisma.job.findMany({
        where: {
          isActive: true,
          OR: orConditions
        },
        take: 5,
        select: {
          id: true,
          title: true,
          skills: true
        }
      });

      debugInfo.matchedJobsTest = {
        skillsSearched: allSkills,
        foundMatches: matchedJobs.length,
        sampleMatches: matchedJobs.map(j => ({
          id: j.id,
          title: j.title
        }))
      };
    } else {
      debugInfo.steps.push("⚠️ Skipping recommendations query - no skills to search");
    }

    debugInfo.steps.push("✅ ALL CHECKS COMPLETE");
    debugInfo.summary = {
      authenticated: true,
      userExists: true,
      hasSkills: allSkills.length > 0,
      hasJobs: totalJobs > 0,
      canMatch: allSkills.length > 0 && activeJobs > 0,
      recommendation: 
        allSkills.length === 0 ? "❌ User needs to add skills to their profile or upload resume" :
        activeJobs === 0 ? "❌ Database has no active jobs" :
        "✅ Everything looks good - recommendations should work"
    };

    return NextResponse.json({
      success: true,
      debug: debugInfo
    });

  } catch (error: any) {
    debugInfo.errors.push(`❌ EXCEPTION: ${error.message}`);
    debugInfo.exception = {
      message: error.message,
      stack: error.stack
    };
    
    return NextResponse.json({
      success: false,
      debug: debugInfo
    }, { status: 500 });
  }
}

