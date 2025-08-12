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
  params: {
    id: string;
  };
}

// GET /api/users/[id] - Get specific user profile
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID',
      }, { status: 400 });
    }

    // Extract current user for authorization
    const currentUser = extractUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const db = databaseService.getClient();

    // Get user from database
    const userResult = await db.query(`
      SELECT 
        id, email, "firstName", "lastName", role, phone, location, bio,
        skills, experience, education, "profilePicture", "isVerified", 
        "isActive", "createdAt", "updatedAt"
      FROM "User"
      WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Check if current user can view this profile
    const canViewProfile = (
      currentUser.id === userId || // Own profile
      currentUser.role === 'admin' || // Admin can view any profile
      user.isActive // Public profiles only if active
    );

    if (!canViewProfile) {
      return NextResponse.json({
        success: false,
        error: 'Access denied',
      }, { status: 403 });
    }

    // Get additional user statistics
    const statsResult = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM "JobBookmark" WHERE "userId" = $1) as bookmarked_jobs,
        (SELECT COUNT(*) FROM "Job" WHERE "createdBy" = $1) as posted_jobs
    `, [userId]);

    const stats = statsResult.rows[0] || { bookmarked_jobs: 0, posted_jobs: 0 };

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
        bookmarked_jobs: parseInt(stats.bookmarked_jobs),
        posted_jobs: parseInt(stats.posted_jobs),
      },
    };

    // Remove sensitive information for non-admin users viewing others
    if (currentUser.id !== userId && currentUser.role !== 'admin') {
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
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID',
      }, { status: 400 });
    }

    // Extract current user for authorization
    const currentUser = extractUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Check if user can update this profile
    const canUpdate = (
      currentUser.id === userId || // Own profile
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
    const currentUserResult = await db.query(
      'SELECT password, role FROM "User" WHERE id = $1',
      [userId]
    );

    if (currentUserResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    const existingUser = currentUserResult.rows[0];

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

    const updateResult = await db.query(updateQuery, updateParams);
    const updatedUser = updateResult.rows[0];

    return NextResponse.json({
      success: true,
      message: 'User profile updated successfully',
      user: {
        id: updatedUser.id.toString(),
        email: updatedUser.email,
        first_name: updatedUser.firstName,
        last_name: updatedUser.lastName,
        role: updatedUser.role,
        updated_at: updatedUser.updatedAt.toISOString(),
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
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID',
      }, { status: 400 });
    }

    // Extract current user for authorization
    const currentUser = extractUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
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
    const userResult = await db.query(
      'SELECT id, email FROM "User" WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Soft delete: mark user as inactive
    await db.query(`
      UPDATE "User" 
      SET "isActive" = false, "updatedAt" = $1
      WHERE id = $2
    `, [new Date(), userId]);

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
