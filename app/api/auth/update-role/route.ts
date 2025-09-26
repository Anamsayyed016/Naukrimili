import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateRoleSchema = z.object({
  role: z.enum(['jobseeker', 'employer'])
});

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateRoleSchema.parse(body);

    console.log('Update role request:', {
      userId: session.user.id,
      email: session.user.email,
      role: validatedData.role
    });

    // Single query to get all user data including role lock fields
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    }) as any;

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already role-locked
    if (existingUser.roleLocked) {
      const lockedRole = existingUser.lockedRole;
      const reason = existingUser.roleLockReason || 'Role switching is not allowed after initial selection';
      
      return NextResponse.json({
        success: false,
        error: `Cannot change role. You are locked as ${lockedRole}. ${reason}`,
        currentRole: existingUser.role,
        lockedRole: lockedRole,
        reason: reason
      }, { status: 403 });
    }

    // Check if user already has the same role
    if (existingUser.role === validatedData.role) {
      return NextResponse.json({
        success: true,
        message: 'Role is already set to the requested value',
        user: existingUser
      });
    }

    // Update user role and lock it
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        role: validatedData.role,
        roleLocked: true,
        lockedRole: validatedData.role,
        roleLockReason: `Role locked as ${validatedData.role} after initial selection`
      } as any,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    }) as any;

    console.log('Role updated and locked successfully:', updatedUser);

    // Fetch the updated user with role lock fields for response
    const finalUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    }) as any;

    return NextResponse.json({
      success: true,
      message: 'Role updated and locked successfully',
      user: {
        id: finalUser.id,
        email: finalUser.email,
        name: finalUser.name,
        role: finalUser.role,
        roleLocked: finalUser.roleLocked,
        lockedRole: finalUser.lockedRole,
        roleLockReason: finalUser.roleLockReason
      }
    });

  } catch (error) {
    console.error('Update role error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid role provided' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update role' },
      { status: 500 }
    );
  }
}