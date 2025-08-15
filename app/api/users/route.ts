/**
 * Enhanced User Management API - Real Database Integration
 * GET /api/users - Get user list (admin only)
 * POST /api/users - Create new user
 * GET /api/users/[id] - Get specific user
 * PUT /api/users/[id] - Update user
 * DELETE /api/users/[id] - Delete user
 */

import { NextRequest, NextResponse } from 'next/server';
import { databaseService, extractUserFromRequest, extractPaginationFromRequest } from '@/lib/database-service';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// User creation schema
const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['jobseeker', 'employer', 'admin']).default('jobseeker'),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).default([]),
  experience: z.string().optional(),
  education: z.string().optional(),
  profilePicture: z.string().url().optional(),
  isVerified: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

// User update schema (partial)
const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

// User search/filter schema
const userSearchSchema = z.object({
  q: z.string().optional(),
  role: z.enum(['jobseeker', 'employer', 'admin']).optional(),
  location: z.string().optional(),
  skills: z.string().optional().transform(val => val ? val.split(',').filter(Boolean) : undefined),
  isVerified: z.string().optional().transform(val => val === 'true'),
  isActive: z.string().optional().transform(val => val === 'true'),
  sort_by: z.enum(['createdAt', 'email', 'firstName', 'lastName']).optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// GET /api/users - Get user list with filtering (admin only)
export async function GET(request: NextRequest) {
  try {
    // Extract user authentication
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

    // Check admin permission
    if (currentUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    // Validate and parse search parameters
    const validatedParams = userSearchSchema.parse(
      Object.fromEntries(searchParams.entries())
    );

    // Extract pagination parameters
    const pagination = extractPaginationFromRequest(request);

    // Build database query
    const db = databaseService.getClient();
    
    // Build where conditions for Prisma
    const whereConditions: any = {};

    if (validatedParams.q) {
      whereConditions.OR = [
        { firstName: { contains: validatedParams.q, mode: 'insensitive' } },
        { lastName: { contains: validatedParams.q, mode: 'insensitive' } },
        { email: { contains: validatedParams.q, mode: 'insensitive' } }
      ];
    }

    if (validatedParams.role) {
      whereConditions.role = validatedParams.role;
    }

    if (validatedParams.location) {
      whereConditions.location = { contains: validatedParams.location, mode: 'insensitive' };
    }

    if (validatedParams.skills && validatedParams.skills.length > 0) {
      whereConditions.skills = { hasSome: validatedParams.skills };
    }

    if (validatedParams.isVerified !== undefined) {
      whereConditions.isVerified = validatedParams.isVerified;
    }

    if (validatedParams.isActive !== undefined) {
      whereConditions.isActive = validatedParams.isActive;
    }

    // Build order clause
    const orderBy = validatedParams.sort_by || 'createdAt';
    const orderDirection = validatedParams.sort_order;

    // Get total count
    const total = await db.user.count({ where: whereConditions });

    // Calculate pagination
    const totalPages = Math.ceil(total / pagination.limit);
    const offset = (pagination.page - 1) * pagination.limit;

    // Get users with Prisma
    const users = await db.user.findMany({
      where: whereConditions,
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
      },
      orderBy: {
        [orderBy]: orderDirection === 'desc' ? 'desc' : 'asc'
      },
      skip: offset,
      take: pagination.limit,
    });

    // Transform users for response
    const transformedUsers = users.map(user => ({
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
    }));

    return NextResponse.json({
      success: true,
      message: `Found ${total} users`,
      users: transformedUsers,
      pagination: {
        current_page: pagination.page,
        total_pages: totalPages,
        total_results: total,
        per_page: pagination.limit,
        has_next: pagination.page < totalPages,
        has_prev: pagination.page > 1,
      },
      filters: validatedParams,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Users GET error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid search parameters',
        details: error.errors,
        users: [],
        pagination: { current_page: 1, total_pages: 0, total_results: 0, per_page: 20 },
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message,
      users: [],
      pagination: { current_page: 1, total_pages: 0, total_results: 0, per_page: 20 },
    }, { status: 500 });
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    const db = databaseService.getClient();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
      select: { id: true }
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User already exists',
        message: 'A user with this email address already exists',
      }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user in database using Prisma
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
        phone: validatedData.phone,
        location: validatedData.location,
        bio: validatedData.bio,
        skills: validatedData.skills,
        experience: validatedData.experience,
        education: validatedData.education,
        profilePicture: validatedData.profilePicture,
        isVerified: validatedData.isVerified,
        isActive: validatedData.isActive,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id.toString(),
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        created_at: user.createdAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    }, { status: 201 });

  } catch (error: any) {
    console.error('Users POST error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user data',
        details: error.errors,
      }, { status: 400 });
    }

    // Handle database constraint errors
    if (error.code === '23505') { // PostgreSQL unique constraint error
      return NextResponse.json({
        success: false,
        error: 'User already exists',
        message: 'A user with this email address already exists',
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create user',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
    },
  });
}
