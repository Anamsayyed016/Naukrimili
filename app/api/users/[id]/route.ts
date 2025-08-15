/**
 * Enhanced User Profile API - Real Database Integration
 * GET /api/users/[id] - Get specific user profile
 * PUT /api/users/[id] - Update user profile
 * DELETE /api/users/[id] - Delete user account
 */

import { NextRequest, NextResponse } from 'next/server';
import { databaseService, extractUserFromRequest } from '@/lib/database-service';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// User update schema (partial)
const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  profilePicture: z.string().url().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
  // Admin-only fields
  role: z.enum(['jobseeker', 'employer', 'admin']).optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/users/[id] - Get specific user profile
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID',
      }, { status: 400 });
    }

    // Extract current user for authorization
    const currentUserAuth = extractUserFromRequest(request);
    if (!currentUserAuth) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Get current user's full data for authorization
    const currentUser = await databaseService.getClient().user.findUnique({
      where: { id: currentUserAuth.userId.toString() },
      select: { id: true, role: true }
    });

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'Current user not found',
      }, { status: 401 });
    }

    const db = databaseService.getClient();

    // Get user from database using Prisma
    const user = await db.user.findUnique({
      where: { id: userId.toString() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        location: true,
        bio: true,
        skills: true,
        experience: true,
        education: true,
        profilePicture: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Check if current user can view this profile
    const canViewProfile = (
      currentUser.id === userId.toString() || // Own profile
      currentUser.role === 'admin' || // Admin can view any profile
      user.isActive // Public profiles only if active
    );

    if (!canViewProfile) {
      return NextResponse.json({
        success: false,
        error: 'Access denied',
      }, { status: 403 });
    }

    // Get additional user statistics using Prisma
    const [bookmarkedJobs, postedJobs] = await Promise.all([
      db.jobBookmark.count({
        where: { userId: userId.toString() }
      }),
      db.job.count({
        where: { createdBy: userId.toString() }
      })
    ]);

    // Transform user data for response
    const transformedUser = {
      id: user.id.toString(),
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      full_name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      phone: user.phone,
      location: user.location,
      bio: user.bio,
      skills: user.skills || [],
      experience: user.experience,
      education: user.education,
      profile_picture: user.profilePicture,
      is_verified: user.isVerified,
      is_active: user.isActive,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
      statistics: {
        bookmarked_jobs: parseInt(bookmarkedJobs.toString()),
        posted_jobs: parseInt(postedJobs.toString()),
      },
    };

    // Remove sensitive information for non-admin users viewing others
    if (currentUser.id !== userId.toString() && currentUser.role !== 'admin') {
      delete transformedUser.email;
      delete transformedUser.phone;
    }

    return NextResponse.json({
      success: true,
      user: transformedUser,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('User GET error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user profile',
      message: error.message,
    }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user profile
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID',
      }, { status: 400 });
    }

    // Extract current user for authorization
    const currentUserAuth = extractUserFromRequest(request);
    if (!currentUserAuth) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Get current user's full data for authorization
    const currentUser = await databaseService.getClient().user.findUnique({
      where: { id: currentUserAuth.userId.toString() },
      select: { id: true, role: true }
    });

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'Current user not found',
      }, { status: 401 });
    }

    // Check if user can update this profile
    const canUpdate = (
      currentUser.id === userId.toString() || // Own profile
      currentUser.role === 'admin' // Admin can update any profile
    );

    if (!canUpdate) {
      return NextResponse.json({
        success: false,
        error: 'Access denied',
      }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    const db = databaseService.getClient();

    // Get current user data
    const currentUserResult = await db.user.findUnique({
      where: { id: userId.toString() },
      select: { password: true, role: true }
    });

    if (!currentUserResult) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    const existingUser = currentUserResult;

    // Handle password update
    let hashedNewPassword = null;
    if (validatedData.newPassword) {
      // Verify current password if updating own profile
      if (currentUser.id === userId) {
        if (!validatedData.currentPassword) {
          return NextResponse.json({
            success: false,
            error: 'Current password required for password update',
          }, { status: 400 });
        }

        const passwordMatch = await bcrypt.compare(
          validatedData.currentPassword,
          existingUser.password
        );

        if (!passwordMatch) {
          return NextResponse.json({
            success: false,
            error: 'Current password is incorrect',
          }, { status: 400 });
        }
      }

      hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 12);
    }

    // Build update query
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    if (validatedData.firstName !== undefined) {
      updateFields.push(`"firstName" = $${paramIndex}`);
      updateParams.push(validatedData.firstName);
      paramIndex++;
    }

    if (validatedData.lastName !== undefined) {
      updateFields.push(`"lastName" = $${paramIndex}`);
      updateParams.push(validatedData.lastName);
      paramIndex++;
    }

    if (validatedData.phone !== undefined) {
      updateFields.push(`phone = $${paramIndex}`);
      updateParams.push(validatedData.phone);
      paramIndex++;
    }

    if (validatedData.location !== undefined) {
      updateFields.push(`location = $${paramIndex}`);
      updateParams.push(validatedData.location);
      paramIndex++;
    }

    if (validatedData.bio !== undefined) {
      updateFields.push(`bio = $${paramIndex}`);
      updateParams.push(validatedData.bio);
      paramIndex++;
    }

    if (validatedData.skills !== undefined) {
      updateFields.push(`skills = $${paramIndex}`);
      updateParams.push(validatedData.skills);
      paramIndex++;
    }

    if (validatedData.experience !== undefined) {
      updateFields.push(`experience = $${paramIndex}`);
      updateParams.push(validatedData.experience);
      paramIndex++;
    }

    if (validatedData.education !== undefined) {
      updateFields.push(`education = $${paramIndex}`);
      updateParams.push(validatedData.education);
      paramIndex++;
    }

    if (validatedData.profilePicture !== undefined) {
      updateFields.push(`"profilePicture" = $${paramIndex}`);
      updateParams.push(validatedData.profilePicture);
      paramIndex++;
    }

    if (hashedNewPassword) {
      updateFields.push(`password = $${paramIndex}`);
      updateParams.push(hashedNewPassword);
      paramIndex++;
    }

    // Admin-only fields
    if (currentUser.role === 'admin') {
      if (validatedData.role !== undefined) {
        updateFields.push(`role = $${paramIndex}`);
        updateParams.push(validatedData.role);
        paramIndex++;
      }

      if (validatedData.isVerified !== undefined) {
        updateFields.push(`"isVerified" = $${paramIndex}`);
        updateParams.push(validatedData.isVerified);
        paramIndex++;
      }

      if (validatedData.isActive !== undefined) {
        updateFields.push(`"isActive" = $${paramIndex}`);
        updateParams.push(validatedData.isActive);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No fields to update',
      }, { status: 400 });
    }

    // Add updated timestamp
    updateFields.push(`"updatedAt" = $${paramIndex}`);
    updateParams.push(new Date());
    paramIndex++;

    // Add user ID for WHERE clause
    updateParams.push(userId);

    // Update user in database
    const updateQuery = `
      UPDATE "User" 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, "firstName", "lastName", role, "updatedAt"
    `;

    const updateResult = await db.user.update({
      where: { id: userId },
      data: {
        ...(validatedData.firstName !== undefined ? { firstName: validatedData.firstName } : {}),
        ...(validatedData.lastName !== undefined ? { lastName: validatedData.lastName } : {}),
        ...(validatedData.phone !== undefined ? { phone: validatedData.phone } : {}),
        ...(validatedData.location !== undefined ? { location: validatedData.location } : {}),
        ...(validatedData.bio !== undefined ? { bio: validatedData.bio } : {}),
        ...(validatedData.skills !== undefined ? { skills: validatedData.skills } : {}),
        ...(validatedData.experience !== undefined ? { experience: validatedData.experience } : {}),
        ...(validatedData.education !== undefined ? { education: validatedData.education } : {}),
        ...(validatedData.profilePicture !== undefined ? { profilePicture: validatedData.profilePicture } : {}),
        ...(hashedNewPassword ? { password: hashedNewPassword } : {}),
        ...(currentUser.role === 'admin' && validatedData.role !== undefined ? { role: validatedData.role } : {}),
        ...(currentUser.role === 'admin' && validatedData.isVerified !== undefined ? { isVerified: validatedData.isVerified } : {}),
        ...(currentUser.role === 'admin' && validatedData.isActive !== undefined ? { isActive: validatedData.isActive } : {}),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User profile updated successfully',
      user: {
        id: updateResult.id.toString(),
        email: updateResult.email,
        first_name: updateResult.firstName,
        last_name: updateResult.lastName,
        role: updateResult.role,
        updated_at: updateResult.updatedAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('User PUT error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user data',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update user profile',
      message: error.message,
    }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user account (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID',
      }, { status: 400 });
    }

    // Extract current user for authorization
    const currentUserAuth = extractUserFromRequest(request);
    if (!currentUserAuth) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Get current user's full data for authorization
    const currentUser = await databaseService.getClient().user.findUnique({
      where: { id: currentUserAuth.userId.toString() },
      select: { id: true, role: true }
    });

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'Current user not found',
      }, { status: 401 });
    }

    // Check if user can delete this account
    const canDelete = (
      currentUser.id === userId || // Own account
      currentUser.role === 'admin' // Admin can delete any account
    );

    if (!canDelete) {
      return NextResponse.json({
        success: false,
        error: 'Access denied',
      }, { status: 403 });
    }

    const db = databaseService.getClient();

    // Check if user exists
    const userResult = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });

    if (!userResult) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Soft delete: mark user as inactive
    await db.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User account deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('User DELETE error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to delete user account',
      message: error.message,
    }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
    },
  });
}
