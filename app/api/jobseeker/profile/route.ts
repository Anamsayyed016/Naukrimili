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

    const userId = session.user.id;

    const [
      user,
      recentApplications,
      recentBookmarks,
      totalApplications,
      activeApplications,
      interviewInvites,
      totalBookmarks,
      totalResumes,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          resumes: {
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
              isActive: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      }),
      prisma.application.findMany({
        where: { userId },
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
      }),
      prisma.jobBookmark.findMany({
        where: { userId },
        select: {
          id: true,
          createdAt: true,
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              location: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.application.count({ where: { userId } }),
      prisma.application.count({
        where: {
          userId,
          status: { in: ['submitted', 'reviewed', 'interview'] }
        }
      }),
      prisma.application.count({
        where: { userId, status: 'interview' }
      }),
      prisma.jobBookmark.count({ where: { userId } }),
      prisma.resume.count({ where: { userId } }),
    ]);

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Active Resume parsed profile (source of truth for structured fields)
    const activeResume = await prisma.resume.findFirst({
      where: { userId, isActive: true },
      select: { parsedData: true },
    });
    const parsed = (activeResume?.parsedData || {}) as any;

    // Calculate profile completion percentage
    const profileFields = [
      user.firstName || user.lastName,
      user.bio,
      user.location,
      user.skills?.length > 0,
      user.experience,
      user.education,
      user.profilePicture,
      user.phone
    ];

    // ParsedData fields (count these too so completion matches resume upload flow)
    const parsedSkillsOk = Array.isArray(parsed?.skills) ? parsed.skills.length > 0 : false;
    const parsedEducationOk = Array.isArray(parsed?.education) ? parsed.education.length > 0 : false;
    const parsedExperienceOk = Array.isArray(parsed?.experience) ? parsed.experience.length > 0 : false;
    const parsedCertsOk = Array.isArray(parsed?.certifications) ? parsed.certifications.length > 0 : false;
    const parsedLangsOk = Array.isArray(parsed?.languages) ? parsed.languages.length > 0 : false;
    const parsedSummaryOk = typeof parsed?.summary === 'string' ? parsed.summary.trim().length > 10 : false;
    const parsedExpectedSalaryOk = !!(parsed?.expectedSalary && String(parsed.expectedSalary).trim().length > 0);

    // Derived from latest experience
    const expArr = Array.isArray(parsed?.experience) ? parsed.experience : [];
    const isCurrent = (e: any) =>
      e?.current === true ||
      /^(present|current|now|ongoing)$/i.test(String(e?.endDate || e?.end_date || e?.end || ''));
    const latestExp =
      expArr.length > 0
        ? [...expArr].sort((a, b) => (isCurrent(b) ? 1 : 0) - (isCurrent(a) ? 1 : 0))[0]
        : null;
    const currentCompanyOk = !!(latestExp?.company && String(latestExp.company).trim().length > 0);
    const currentDesignationOk = !!(
      (latestExp?.position || latestExp?.title) &&
      String(latestExp.position || latestExp.title).trim().length > 0
    );

    const completionFields = [
      // User account profile
      user.firstName,
      user.lastName,
      user.email,
      user.phone,
      user.location,
      // Structured resume profile
      parsedSummaryOk,
      parsedSkillsOk,
      parsedEducationOk,
      parsedExperienceOk,
      parsedCertsOk,
      parsedLangsOk,
      parsedExpectedSalaryOk,
      // Derived
      currentCompanyOk,
      currentDesignationOk,
    ];

    const completedFields = completionFields.filter((v) => !!v).length;
    const profileCompletion = Math.round((completedFields / completionFields.length) * 100);

    const stats = {
      totalApplications,
      activeApplications,
      interviewInvites,
      totalBookmarks,
      totalResumes,
      profileCompletion
    };

    // CRITICAL FIX: Parse JSON strings to arrays
    let parsedSkills = [];
    try {
      parsedSkills = typeof user.skills === 'string' 
        ? JSON.parse(user.skills) 
        : Array.isArray(user.skills) 
        ? user.skills 
        : [];
    } catch (e) {
      parsedSkills = [];
    }

    let parsedJobTypes = [];
    try {
      parsedJobTypes = typeof user.jobTypePreference === 'string' 
        ? JSON.parse(user.jobTypePreference) 
        : Array.isArray(user.jobTypePreference) 
        ? user.jobTypePreference 
        : [];
    } catch (e) {
      parsedJobTypes = [];
    }

    const normalizedUser = {
      ...user,
      applications: recentApplications,
      bookmarks: recentBookmarks,
      skills: parsedSkills,
      jobTypePreference: parsedJobTypes,
      remotePreference: user.remotePreference || false,
      stats
    };

    return NextResponse.json({
      success: true,
      data: normalizedUser
    });
  } catch (error: any) {
    console.error('Error fetching jobseeker profile:', error);
    // IMPROVED ERROR HANDLING: Show actual error message for debugging
    const errorMessage = error?.message || 'Failed to fetch profile';
    return NextResponse.json(
      { success: false, error: errorMessage, details: error?.toString() },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      firstName,
      lastName,
      phone,
      location,
      bio,
      skills,
      experience,
      education,
      profilePicture,
      locationPreference,
      salaryExpectation,
      jobTypePreference,
      remotePreference,
      website,
      linkedin,
      github
    } = body;

    // Split name into firstName and lastName if provided
    let userFirstName = firstName;
    let userLastName = lastName;
    
    if (name && !firstName && !lastName) {
      const nameParts = name.trim().split(' ');
      userFirstName = nameParts[0];
      userLastName = nameParts.slice(1).join(' ') || '';
    }

    // Validate required fields
    if (!name && !firstName) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Phone changes must go through OTP verify flow (LinkPhoneSection)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true, phoneVerified: true },
    });

    if (phone !== undefined && phone !== currentUser?.phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Use the mobile verification section to link or change your phone number.',
        },
        { status: 400 }
      );
    }

    // RELAXED VALIDATION: Make all validations optional and more flexible
    // Salary validation - just check if it's a reasonable number
    if (salaryExpectation && (isNaN(Number(salaryExpectation)) || Number(salaryExpectation) < 0)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid salary expectation' },
        { status: 400 }
      );
    }

    // URL validations - RELAXED: Just check if it looks like a URL
    if (website && website.trim() && !website.match(/^https?:\/\/.+\..+/)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid website URL (e.g., https://yoursite.com)' },
        { status: 400 }
      );
    }

    // LinkedIn - RELAXED: Accept any linkedin.com URL
    if (linkedin && linkedin.trim() && !linkedin.match(/linkedin\.com/i)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid LinkedIn URL' },
        { status: 400 }
      );
    }

    // GitHub - RELAXED: Accept any github.com URL
    if (github && github.trim() && !github.match(/github\.com/i)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid GitHub URL' },
        { status: 400 }
      );
    }

    // CRITICAL FIX: Convert arrays to JSON strings for Prisma String fields
    const skillsString = Array.isArray(skills) 
      ? JSON.stringify(skills) 
      : typeof skills === 'string' 
      ? skills 
      : '[]';
    
    const jobTypeString = Array.isArray(jobTypePreference) 
      ? JSON.stringify(jobTypePreference) 
      : typeof jobTypePreference === 'string' 
      ? jobTypePreference 
      : null;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: userFirstName,
        lastName: userLastName,
        location,
        bio,
        skills: skillsString,
        experience,
        education,
        profilePicture,
        locationPreference,
        salaryExpectation: salaryExpectation ? parseInt(salaryExpectation) : null,
        jobTypePreference: jobTypeString,
        remotePreference: remotePreference || false,
        website,
        linkedin,
        github,
        updatedAt: new Date()
      },
      include: {
        applications: {
          select: {
            id: true,
            status: true
          }
        },
        bookmarks: {
          select: {
            id: true
          }
        },
        resumes: {
          select: {
            id: true
          }
        }
      }
    });

    // CRITICAL FIX: Calculate stats after update (same as GET)
    const profileFields = [
      updatedUser.firstName || updatedUser.lastName,
      updatedUser.bio,
      updatedUser.location,
      skillsString && skillsString !== '[]',
      updatedUser.experience,
      updatedUser.education,
      updatedUser.profilePicture,
      updatedUser.phone
    ];
    const completedFields = profileFields.filter(field => field).length;
    const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

    // Calculate stats after update (same count logic as GET)
    const [totalApplications, activeApplications, interviewInvites, totalBookmarks, totalResumes] =
      await Promise.all([
        prisma.application.count({ where: { userId: session.user.id } }),
        prisma.application.count({
          where: {
            userId: session.user.id,
            status: { in: ['submitted', 'reviewed', 'interview'] },
          },
        }),
        prisma.application.count({
          where: { userId: session.user.id, status: 'interview' },
        }),
        prisma.jobBookmark.count({ where: { userId: session.user.id } }),
        prisma.resume.count({ where: { userId: session.user.id } }),
      ]);

    const stats = {
      totalApplications,
      activeApplications,
      interviewInvites,
      totalBookmarks,
      totalResumes,
      profileCompletion,
    };

    // CRITICAL FIX: Parse JSON strings back to arrays for response
    let responseSkills = [];
    try {
      responseSkills = typeof updatedUser.skills === 'string' 
        ? JSON.parse(updatedUser.skills) 
        : Array.isArray(updatedUser.skills) 
        ? updatedUser.skills 
        : [];
    } catch (e) {
      responseSkills = [];
    }

    let responseJobTypes = [];
    try {
      responseJobTypes = typeof updatedUser.jobTypePreference === 'string' 
        ? JSON.parse(updatedUser.jobTypePreference) 
        : Array.isArray(updatedUser.jobTypePreference) 
        ? updatedUser.jobTypePreference 
        : [];
    } catch (e) {
      responseJobTypes = [];
    }

    const normalizedUser = {
      ...updatedUser,
      skills: responseSkills,
      jobTypePreference: responseJobTypes,
      remotePreference: updatedUser.remotePreference || false,
      stats // CRITICAL: Include stats in response
    };

    return NextResponse.json({
      success: true,
      data: normalizedUser,
      message: 'Profile updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating jobseeker profile:', error);
    // IMPROVED ERROR HANDLING: Show actual error message for debugging
    const errorMessage = error?.message || 'Failed to update profile';
    return NextResponse.json(
      { success: false, error: errorMessage, details: error?.toString() },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Check if user has active applications
    const activeApplications = await prisma.application.count({
      where: {
        userId: session.user.id,
        status: { in: ['submitted', 'reviewed', 'interview'] }
      }
    });

    if (activeApplications > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete account with active applications. Please withdraw all applications first.' 
        },
        { status: 400 }
      );
    }

    // Delete user and all related data
    await prisma.$transaction(async (tx) => {
      // Delete applications
      await tx.application.deleteMany({
        where: { userId: session.user.id }
      });

      // Delete bookmarks
      await tx.jobBookmark.deleteMany({
        where: { userId: session.user.id }
      });

      // Delete resumes
      await tx.resume.deleteMany({
        where: { userId: session.user.id }
      });

      // Delete user
      await tx.user.delete({
        where: { id: session.user.id }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (_error) {
    console.error('Error deleting jobseeker account:', _error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
