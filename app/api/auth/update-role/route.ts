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
  try {
    const body = await request.json();
    console.log('Update role request body:', body);
    
    const validatedData = updateRoleSchema.parse(body);
    console.log('Validated update role data:', validatedData);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: validatedData.userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: validatedData.userId },
      data: {
        role: validatedData.role,
        updatedAt: new Date()
      }
    });

    console.log('User role updated successfully:', updatedUser.id);

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