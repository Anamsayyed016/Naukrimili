import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Profile update schema
const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  profilePicture: z.string().url().optional(),
  currentTitle: z.string().optional(),
  jobTypes: z.array(z.string()).optional(),
  salaryExpectation: z.string().optional(),
  remotePreference: z.enum(['remote', 'hybrid', 'onsite']).optional(),
});

// Get user from request
function getUserFromRequest(request: NextRequest): string | null {
  const headerId = request.headers.get('x-user-id');
  return headerId || process.env.SEED_USER_ID || null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Get or create user with profile data
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        resumes: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        applications: {
          select: {
            id: true,
            status: true,
            appliedAt: true,
            job: {
              select: {
                title: true,
                company: true,
              }
            }
          },
          orderBy: { appliedAt: 'desc' },
          take: 5
        }
      }
    });

    if (!user) {
      // Create user if not exists (for development)
      user = await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@placeholder.local`,
          name: 'New User',
          firstName: 'New',
          lastName: 'User',
        },
        include: {
          resumes: true,
          applications: {
            include: {
              job: {
                select: {
                  title: true,
                  company: true,
                }
              }
            }
          }
        }
      });
    }

    // Calculate profile completion
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'location', 'bio', 'skills', 'experience'];
    const completedFields = requiredFields.filter(field => {
      const value = user[field as keyof typeof user];
      return value && (Array.isArray(value) ? value.length > 0 : value.toString().trim().length > 0);
    });
    const profileCompletion = Math.round((completedFields.length / requiredFields.length) * 100);

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        location: user.location,
        bio: user.bio,
        skills: user.skills || [],
        experience: user.experience,
        education: user.education,
        profilePicture: user.profilePicture,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        profileCompletion,
        resumeCount: user.resumes.length,
        applicationCount: user.applications.length,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      resumes: user.resumes.map(resume => ({
        id: resume.id,
        fileName: resume.fileName,
        fileUrl: resume.fileUrl,
        createdAt: resume.createdAt.toISOString(),
      })),
      recentApplications: user.applications.map(app => ({
        id: app.id,
        status: app.status,
        appliedAt: app.appliedAt.toISOString(),
        jobTitle: app.job.title,
        company: app.job.company,
      })),
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch profile',
      message: error.message,
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = updateProfileSchema.parse(data);

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        name: validatedData.firstName && validatedData.lastName 
          ? `${validatedData.firstName} ${validatedData.lastName}` 
          : undefined,
        phone: validatedData.phone,
        location: validatedData.location,
        bio: validatedData.bio,
        skills: validatedData.skills,
        experience: validatedData.experience,
        education: validatedData.education,
        profilePicture: validatedData.profilePicture,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        location: true,
        bio: true,
        skills: true,
        experience: true,
        education: true,
        profilePicture: true,
        role: true,
        updatedAt: true,
      }
    });

    // Calculate new profile completion
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'location', 'bio', 'skills', 'experience'];
    const completedFields = requiredFields.filter(field => {
      const value = updatedUser[field as keyof typeof updatedUser];
      return value && (Array.isArray(value) ? value.length > 0 : value.toString().trim().length > 0);
    });
    const profileCompletion = Math.round((completedFields.length / requiredFields.length) * 100);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        ...updatedUser,
        profileCompletion,
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Profile PUT error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid profile data',
        details: error.errors,
      }, { status: 400 });
    }

    // Handle Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        error: 'Profile not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update profile',
      message: error.message,
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const { action, data } = await request.json();
    
    switch (action) {
      case 'uploadResume': {
        // Handle resume upload metadata
        const resume = await prisma.resume.create({
          data: {
            userId,
            fileName: data.fileName || 'Untitled Resume',
            fileUrl: data.fileUrl || '',
            fileSize: data.fileSize,
            mimeType: data.mimeType,
            parsedData: data.parsedData || {},
            atsScore: data.atsScore,
            isActive: true,
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Resume uploaded successfully',
          resume: {
            id: resume.id,
            fileName: resume.fileName,
            fileUrl: resume.fileUrl,
            createdAt: resume.createdAt.toISOString(),
          }
        });
      }

      case 'deleteResume': {
        const resumeId = data.resumeId;
        if (!resumeId) {
          return NextResponse.json({
            success: false,
            error: 'Resume ID is required',
          }, { status: 400 });
        }

        await prisma.resume.delete({
          where: {
            id: resumeId,
            userId, // Ensure user owns the resume
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Resume deleted successfully',
        });
      }

      case 'updatePreferences': {
        // Update job preferences (could be stored in user table or separate preferences table)
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            // Store preferences in a JSON field or create a separate preferences table
            bio: data.jobTypes ? `Job Types: ${data.jobTypes.join(', ')}` : undefined,
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Preferences updated successfully',
          data: updatedUser,
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Profile POST error:', error);

    // Handle Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        error: 'Resource not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      message: error.message,
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}