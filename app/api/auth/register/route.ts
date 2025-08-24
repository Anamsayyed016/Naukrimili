import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { validateCSRF, createCSRFErrorResponse } from '@/lib/utils/csrf';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  confirmPassword: z.string().min(6).max(100),
  role: z.enum(['jobseeker', 'employer']).default('jobseeker'),
  phone: z.string().optional(),
  location: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    const csrfValidation = validateCSRF(request);
    if (!csrfValidation.isValid) {
      return NextResponse.json(
        createCSRFErrorResponse(csrfValidation.error || 'CSRF validation failed'),
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User with this email already exists'
      }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        phone: validatedData.phone,
        location: validatedData.location,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        isActive: true,
        isVerified: false
      }
    });

    // Create default settings for the user
    await prisma.settings.create({
      data: {
        userId: user.id,
        key: 'notifications',
        value: {
          email: true,
          push: true,
          sms: false
        }
      }
    });

    // Create default settings for job preferences
    await prisma.settings.create({
      data: {
        userId: user.id,
        key: 'job_preferences',
        value: {
          jobTypes: ['full-time'],
          experienceLevels: ['entry', 'mid'],
          remotePreference: 'any',
          salaryRange: { min: 0, max: 1000000 },
          locations: [],
          skills: []
        }
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
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        location: user.location,
        createdAt: user.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Registration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Registration failed. Please try again.'
    }, { status: 500 });
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
