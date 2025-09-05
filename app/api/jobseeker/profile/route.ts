import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth-config";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
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
        },
        bookmarks: {
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
        },
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
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Calculate profile completion percentage
    const profileFields = [
      user.name,
      user.bio,
      user.location,
      user.skills?.length > 0,
      user.experience,
      user.education,
      user.profilePicture,
      user.phone
    ];
    const completedFields = profileFields.filter(field => field).length;
    const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

    // Calculate statistics
    const stats = {
      totalApplications: user.applications.length,
      activeApplications: user.applications.filter(app => 
        ['submitted', 'reviewed', 'interview'].includes(app.status)
      ).length,
      totalBookmarks: user.bookmarks.length,
      totalResumes: user.resumes.length,
      profileCompletion
    };

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching jobseeker profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
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

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Validate phone number format if provided
    if (phone && !/^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid phone number' },
        { status: 400 }
      );
    }

    // Validate salary expectation if provided
    if (salaryExpectation && (isNaN(salaryExpectation) || salaryExpectation < 0)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid salary expectation' },
        { status: 400 }
      );
    }

    // Validate website URL if provided
    if (website && !website.match(/^https?:\/\/.+/)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid website URL (e.g., https://yoursite.com)' },
        { status: 400 }
      );
    }

    // Validate LinkedIn URL if provided
    if (linkedin && !linkedin.match(/^https?:\/\/(www\.)?linkedin\.com\/in\/.+/)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid LinkedIn profile URL' },
        { status: 400 }
      );
    }

    // Validate GitHub URL if provided
    if (github && !github.match(/^https?:\/\/(www\.)?github\.com\/.+/)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid GitHub profile URL' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        firstName,
        lastName,
        phone,
        location,
        bio,
        skills: skills || [],
        experience,
        education,
        profilePicture,
        locationPreference,
        salaryExpectation: salaryExpectation ? parseInt(salaryExpectation) : null,
        jobTypePreference: jobTypePreference || [],
        remotePreference: remotePreference || false,
        website,
        linkedin,
        github,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating jobseeker profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
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
  } catch (error) {
    console.error('Error deleting jobseeker account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
