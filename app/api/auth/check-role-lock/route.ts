import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const checkRoleLockSchema = z.object({
  email: z.string().email(),
  requestedRole: z.enum(['jobseeker', 'employer'])
});

/**
 * POST /api/auth/check-role-lock
 * Check if a user can login with a specific role
 * Prevents role switching after initial role selection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, requestedRole } = checkRoleLockSchema.parse(body);

    console.log('🔍 Checking role lock for:', { email, requestedRole });

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roleLocked: true,
        lockedRole: true,
        roleLockReason: true,
        isActive: true
      }
    });

    if (!user) {
      // User doesn't exist, can proceed with registration
      return NextResponse.json({
        success: true,
        canLogin: true,
        message: 'User not found, can proceed with registration'
      });
    }

    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        canLogin: false,
        error: 'Account is deactivated. Please contact support.'
      }, { status: 403 });
    }

    // If user has no role set, this is their first login - allow role selection
    if (!user.role) {
      return NextResponse.json({
        success: true,
        canLogin: true,
        message: 'First time login, role can be selected'
      });
    }

    // If user is not role locked, allow role switching (for backward compatibility)
    if (!user.roleLocked) {
      return NextResponse.json({
        success: true,
        canLogin: true,
        message: 'Role switching allowed'
      });
    }

    // User is role locked - check if requested role matches locked role
    if (user.lockedRole === requestedRole) {
      return NextResponse.json({
        success: true,
        canLogin: true,
        message: 'Role matches locked role'
      });
    }

    // User is trying to switch to a different role - deny access
    const reason = user.roleLockReason || 'Role switching is not allowed after initial selection';
    
    return NextResponse.json({
      success: false,
      canLogin: false,
      error: `Cannot login as ${requestedRole}. ${reason}`,
      currentRole: user.role,
      lockedRole: user.lockedRole,
      reason: reason
    }, { status: 403 });

  } catch (error) {
    console.error('❌ Role lock check error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
