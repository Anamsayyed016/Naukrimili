import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const jobSeekerRegisterSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  skills: z.array(z.string()).default([]),
  experience: z.string().optional(),
  education: z.string().optional(),
  locationPreference: z.string().optional(),
  salaryExpectation: z.number().optional(),
  jobTypePreference: z.array(z.string()).default([]),
  remotePreference: z.boolean().default(false),
  role: z.literal('jobseeker')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Job Seeker Registration request body:', body);
    
    const validatedData = jobSeekerRegisterSchema.parse(body);
    console.log('Validated job seeker data:', validatedData);

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

    // Create job seeker user
    const user = await prisma.user.create({
      data: {
        name: fullName,
        email: validatedData.email,
        password: hashedPassword,
        role: 'jobseeker',
        phone: validatedData.phone || null,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        skills: JSON.stringify(validatedData.skills || []),
        experience: validatedData.experience || null,
        education: validatedData.education || null,
        locationPreference: validatedData.locationPreference || null,
        salaryExpectation: validatedData.salaryExpectation || null,
        jobTypePreference: validatedData.jobTypePreference || null,
        remotePreference: validatedData.remotePreference,
        isActive: true,
        isVerified: false
      }
    });

    console.log('Job Seeker user created successfully:', user.id);

    return NextResponse.json({
      success: true,
      message: 'Job Seeker account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        skills: user.skills,
        locationPreference: user.locationPreference
      },
      token: `user_${user.id}_${Date.now()}` // Simple token for now
    });

  } catch (error) {
    console.error('Job Seeker registration error:', error);
    
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
