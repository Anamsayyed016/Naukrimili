import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEmailToken } from '@/lib/auth/email-verification';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const setPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
});

/**
 * Set Password API
 * Verifies token and sets password for OAuth users
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = setPasswordSchema.parse(body);

    // Verify token
    const verification = await verifyEmailToken(token);

    if (!verification.valid || !verification.email) {
      return NextResponse.json(
        { success: false, error: verification.error || 'Invalid or expired token' },
        { status: 400 }
      );
    }

    const email = verification.email;

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
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify user has Google OAuth account
    if (user.accounts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'This account is not associated with Google OAuth' },
        { status: 400 }
      );
    }

    // Check if password is already set (shouldn't happen, but safety check)
    if (user.password) {
      return NextResponse.json(
        { success: false, error: 'Password already set. Please sign in with your password.' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user with password and mark as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isVerified: true, // Mark as verified when password is set
        emailVerified: new Date()
      }
    });

    // Delete verification token (one-time use)
    await prisma.verificationToken.deleteMany({
      where: { identifier: email }
    });

    console.log('✅ Password set successfully for user:', email);

    return NextResponse.json({
      success: true,
      message: 'Password set successfully! You can now sign in with your email and password.'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('❌ Set password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set password' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

