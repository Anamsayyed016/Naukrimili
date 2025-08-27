import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['jobseeker', 'employer']).default('jobseeker')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Registration request body:', body);
    
    const validatedData = registerSchema.parse(body);
    console.log('Validated data:', validatedData);

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

    // Create full name from first and last name
    const fullName = `${validatedData.firstName} ${validatedData.lastName}`.trim();

    // Create user
    const user = await prisma.user.create({
      data: {
        name: fullName,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        phone: validatedData.phone || null,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        isActive: true,
        isVerified: false
      }
    });

    console.log('User created successfully:', user.id);

    // If user is an employer, create a default company
    if (validatedData.role === 'employer') {
      await prisma.company.create({
        data: {
          name: `${validatedData.firstName}'s Company`,
          description: 'Company profile will be updated later',
          location: 'India',
          industry: 'Technology',
          size: '1-10',
          isVerified: false,
          createdBy: user.id
        }
      });
      console.log('Company created for employer');
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
      console.error('Validation errors:', error.errors);
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-csrf-token',
    },
  });
}
