import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  location: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
  role: z.enum(['jobseeker', 'employer']).default('jobseeker')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if passwords match
    if (validatedData.password !== validatedData.confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12);

    // Extract first and last name from full name
    const nameParts = validatedData.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        phone: validatedData.phone,
        location: validatedData.location,
        firstName: firstName,
        lastName: lastName,
        isActive: true,
        isVerified: false
      }
    });

    // If user is an employer, create a default company
    if (validatedData.role === 'employer') {
      await prisma.company.create({
        data: {
          name: `${firstName}'s Company`,
          description: 'Company profile will be updated later',
          location: validatedData.location || 'India',
          industry: 'Technology',
          size: '1-10',
          isVerified: false,
          createdBy: user.id
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token: `user_${user.id}_${Date.now()}` // Simple token for now
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
