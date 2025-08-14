import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Registration schema
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  role: z.enum(['jobseeker', 'employer', 'admin']).default('jobseeker'),
  phone: z.string().optional(),
  location: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
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

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        firstName: validatedData.firstName || validatedData.name.split(' ')[0],
        lastName: validatedData.lastName || validatedData.name.split(' ').slice(1).join(' '),
        role: validatedData.role,
        phone: validatedData.phone,
        location: validatedData.location,
        isVerified: false,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.createdAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid registration data',
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
      error: 'Failed to register user',
      message: error.message,
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
