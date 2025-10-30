import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { role } = await request.json();

    // Validate role
    if (!role || !['jobseeker', 'employer'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be "jobseeker" or "employer"' },
        { status: 400 }
      );
    }

    // Check if user already has a role and is locked
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        roleLocked: true,
        lockedRole: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // If user already has a locked role, don't allow changes
    if (user.roleLocked && user.lockedRole) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Role is locked and cannot be changed',
          currentRole: user.lockedRole
        },
        { status: 403 }
      );
    }

    // If role is not locked, allow setting or changing the role

    // Update user role and lock it
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role: role,
        roleLocked: true,
        lockedRole: role,
        roleLockReason: `Role locked as ${role} after OAuth signup`
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        roleLocked: true,
        lockedRole: true,
        roleLockReason: true
      }
    });

    console.log('✅ Role set successfully:', {
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      roleLocked: updatedUser.roleLocked
    });

    // Welcome email was already sent during user creation
    console.log('✅ Role selection complete for:', updatedUser.email);

    // Trigger JWT token update by calling NextAuth's update function
    // This will cause the JWT callback to run and fetch fresh user data
    try {
      // JWT token will be updated automatically on next request
      console.log('🔄 Role selection complete');
    } catch {
      console.log('⚠️ Role selection complete');
    }

    return NextResponse.json({
      success: true,
      message: 'Role set and locked successfully',
      user: updatedUser
    });

  } catch (_error) {
    console.error('❌ Error setting role:', _error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to set role',
        details: process.env.NODE_ENV === 'development' ? (_error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's current role status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        roleLocked: true,
        lockedRole: true,
        roleLockReason: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: user,
      needsRoleSelection: !user.role
    });

  } catch (_error) {
    console.error('❌ Error getting role status:', _error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get role status',
        details: process.env.NODE_ENV === 'development' ? (_error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
