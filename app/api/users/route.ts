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
    
    // Build where conditions
    const whereConditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (validatedParams.q) {
      whereConditions.push(`(
        "firstName" ILIKE $${paramIndex} OR 
        "lastName" ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex}
      )`);
      params.push(`%${validatedParams.q}%`);
      paramIndex++;
    }

    if (validatedParams.role) {
      whereConditions.push(`role = $${paramIndex}`);
      params.push(validatedParams.role);
      paramIndex++;
    }

    if (validatedParams.location) {
      whereConditions.push(`location ILIKE $${paramIndex}`);
      params.push(`%${validatedParams.location}%`);
      paramIndex++;
    }

    if (validatedParams.skills && validatedParams.skills.length > 0) {
      whereConditions.push(`skills && $${paramIndex}`);
      params.push(validatedParams.skills);
      paramIndex++;
    }

    if (validatedParams.isVerified !== undefined) {
      whereConditions.push(`"isVerified" = $${paramIndex}`);
      params.push(validatedParams.isVerified);
      paramIndex++;
    }

    if (validatedParams.isActive !== undefined) {
      whereConditions.push(`"isActive" = $${paramIndex}`);
      params.push(validatedParams.isActive);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Build order clause
    const orderBy = validatedParams.sort_by || 'createdAt';
    const orderDirection = validatedParams.sort_order;
    const orderClause = `ORDER BY "${orderBy}" ${orderDirection}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "User"
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const totalPages = Math.ceil(total / pagination.limit);
    const offset = (pagination.page - 1) * pagination.limit;

    // Get users
    const usersQuery = `
      SELECT 
        id, email, "firstName", "lastName", role, phone, location, bio,
        skills, experience, education, "profilePicture", "isVerified", 
        "isActive", "createdAt", "updatedAt"
      FROM "User"
      ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(pagination.limit, offset);
    
    const usersResult = await db.query(usersQuery, params);

    // Transform users for response
    const transformedUsers = usersResult.rows.map(user => ({
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
    const existingUserResult = await db.query(
      'SELECT id FROM "User" WHERE email = $1',
      [validatedData.email]
    );

    if (existingUserResult.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'User already exists',
        message: 'A user with this email address already exists',
      }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user in database
    const createUserResult = await db.query(`
      INSERT INTO "User" (
        email, password, "firstName", "lastName", role, phone, location, bio,
        skills, experience, education, "profilePicture", "isVerified", "isActive"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, email, "firstName", "lastName", role, "createdAt"
    `, [
      validatedData.email,
      hashedPassword,
      validatedData.firstName,
      validatedData.lastName,
      validatedData.role,
      validatedData.phone,
      validatedData.location,
      validatedData.bio,
      validatedData.skills,
      validatedData.experience,
      validatedData.education,
      validatedData.profilePicture,
      validatedData.isVerified,
      validatedData.isActive,
    ]);

    const user = createUserResult.rows[0];

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
