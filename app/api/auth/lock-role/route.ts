import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const lockRoleSchema = z.object({
  role: z.enum(['jobseeker', 'employer']),
  reason: z.string().optional()
});

/**
 * POST /api/auth/lock-role
 * Lock a user's role to prevent role switching
 * This should be called after user confirms their role selection
 */
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
    const { role, reason } = lockRoleSchema.parse(body);

    console.log('🔒 Locking role for user:', {
      userId: session.user.id,
      email: session.user.email,
      role,
      reason
    });

    // Update user with role lock
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        role: role,
        roleLocked: true,
        lockedRole: role,
        roleLockReason: reason || `Role locked as ${role} after initial selection`
      } as any
    });

    console.log('✅ Role locked successfully:', updatedUser);

    return NextResponse.json({
      success: true,
      message: 'Role locked successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.firstName && updatedUser.lastName ? `${updatedUser.firstName} ${updatedUser.lastName}` : updatedUser.firstName || updatedUser.email,
        role: updatedUser.role,
        roleLocked: (updatedUser as any).roleLocked,
        lockedRole: (updatedUser as any).lockedRole,
        roleLockReason: (updatedUser as any).roleLockReason
      }
    });

  } catch (error) {
    console.error('❌ Role lock error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid role provided' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to lock role' },
      { status: 500 }
    );
  }
}
