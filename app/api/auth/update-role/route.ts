import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['jobseeker', 'employer'], {
    errorMap: () => ({ message: 'Role must be either jobseeker or employer' })
  })
});

export async function POST(request: NextRequest) {
  console.log('Update role API endpoint called');
  try {
    const body = await request.json();
    console.log('Update role request body:', body);
    
    const validatedData = updateRoleSchema.parse(body);
    console.log('Validated update role data:', validatedData);
    
    // Additional debugging
    console.log('User ID type:', typeof validatedData.userId);
    console.log('User ID value:', validatedData.userId);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: validatedData.userId }
    });

    if (!existingUser) {
      console.error('User not found:', validatedData.userId);
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found',
          message: 'The user account could not be found. Please try logging in again.'
        },
        { status: 404 }
      );
    }

    // Check if user already has this role
    if (existingUser.role === validatedData.role) {
      console.log('User already has this role:', validatedData.role);
      return NextResponse.json({
        success: true,
        message: 'Role already set',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role
        }
      });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: validatedData.userId },
      data: {
        role: validatedData.role,
        updatedAt: new Date()
      }
    });

    console.log('User role updated successfully:', updatedUser.id, 'from', existingUser.role, 'to', updatedUser.role);

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error('Update role error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed', 
          message: 'Invalid data provided',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    );
  }
}

// GET method for testing endpoint accessibility
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Update role API endpoint is accessible',
    methods: ['POST', 'OPTIONS']
  });
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-csrf-token',
    },
  });
}