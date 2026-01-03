import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const checkSchema = z.object({
  email: z.string().email('Invalid email address')
});

/**
 * Check OAuth Password API
 * Checks if user has Google OAuth account but no password
 * Used to detect OAUTH_PASSWORD_REQUIRED scenario
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = checkSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          where: { provider: 'google' }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: true, requiresPasswordSet: false },
        { status: 200 }
      );
    }

    // Check if user has Google OAuth account but no password
    const hasGoogleAccount = user.accounts.length > 0;
    const hasPassword = !!user.password;

    if (hasGoogleAccount && !hasPassword) {
      return NextResponse.json({
        success: true,
        requiresPasswordSet: true,
        email: user.email
      });
    }

    return NextResponse.json({
      success: true,
      requiresPasswordSet: false
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('❌ Check OAuth password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check password status' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

