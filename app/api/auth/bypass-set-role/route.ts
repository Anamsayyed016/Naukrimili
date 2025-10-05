import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthDisabled, createBypassUser } from '@/lib/auth-bypass';

export async function POST(request: NextRequest) {
  try {
    // Check if auth bypass is enabled
    if (!isAuthDisabled()) {
      return NextResponse.json(
        { success: false, error: 'Authentication bypass is not enabled' },
        { status: 403 }
      );
    }

    const { email, role } = await request.json();

    // Validate input
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    if (!role || !['jobseeker', 'employer'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be "jobseeker" or "employer"' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        role: true,
        roleLocked: true,
        lockedRole: true,
        firstName: true,
        lastName: true
      }
    });

    // If user exists and has a different role, don't allow changes
    if (user && user.role && user.role !== role) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User already exists with a different role',
          currentRole: user.role
        },
        { status: 409 }
      );
    }

    // If user exists with same role or no role, update them
    if (user) {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: role,
          roleLocked: true,
          lockedRole: role,
          roleLockReason: `Role locked as ${role} via bypass mode`,
          isActive: true,
          isVerified: true
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          roleLocked: true,
          lockedRole: true,
          roleLockReason: true,
          isActive: true,
          isVerified: true
        }
      });

      console.log('✅ Bypass: Updated existing user role:', {
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role
      });

      return NextResponse.json({
        success: true,
        message: 'Role updated successfully',
        user: createBypassUser(updatedUser.email, updatedUser.role)
      });
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName: email.split('@')[0],
        lastName: '',
        role: role,
        roleLocked: true,
        lockedRole: role,
        roleLockReason: `Role locked as ${role} via bypass mode`,
        isActive: true,
        isVerified: true,
        skills: '[]',
        phone: null,
        location: null,
        bio: null,
        experience: null,
        education: null,
        jobTypePreference: 'full-time',
        remotePreference: false,
        salaryExpectation: null,
        locationPreference: null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        roleLocked: true,
        lockedRole: true,
        roleLockReason: true,
        isActive: true,
        isVerified: true
      }
    });

    console.log('✅ Bypass: Created new user:', {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: createBypassUser(newUser.email, newUser.role)
    });

  } catch (error) {
    console.error('❌ Bypass role setting error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to set up account',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
