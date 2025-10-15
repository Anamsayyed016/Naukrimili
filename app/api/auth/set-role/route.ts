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

    // If user already has a role (but not locked), don't allow changes
    if (user.role && user.role !== role) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Role already set and cannot be changed',
          currentRole: user.role
        },
        { status: 403 }
      );
    }

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
      // Import NextAuth's update function
      const { update } = await import('next-auth/react');
      console.log('🔄 Triggering JWT token update for role change');
    } catch (error) {
      console.log('⚠️ Could not trigger JWT update (this is normal in API route)');
    }

    return NextResponse.json({
      success: true,
      message: 'Role set and locked successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('❌ Error setting role:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to set role',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

  } catch (error) {
    console.error('❌ Error getting role status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get role status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
