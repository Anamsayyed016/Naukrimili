import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordStrength, logSecurityEvent, getClientIP, getUserAgent } from '@/lib/security-utils';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100)
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword, confirmPassword } = resetPasswordSchema.parse(body);
    
    const clientIP = getClientIP(request);
    const userAgent = getUserAgent(request);

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors
      }, { status: 400 });
    }

    // Find and validate reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired reset token'
      }, { status: 400 });
    }

    // Check if token is expired
    if (new Date() > resetToken.expires) {
      await logSecurityEvent(resetToken.userId, 'password_reset_expired', false, { 
        token,
        ipAddress: clientIP,
        userAgent 
      }, request);
      
      return NextResponse.json({
        success: false,
        error: 'Reset token has expired. Please request a new password reset.'
      }, { status: 400 });
    }

    // Check if token has already been used
    if (resetToken.used) {
      await logSecurityEvent(resetToken.userId, 'password_reset_already_used', false, { 
        token,
        ipAddress: clientIP,
        userAgent 
      }, request);
      
      return NextResponse.json({
        success: false,
        error: 'This reset token has already been used. Please request a new password reset.'
      }, { status: 400 });
    }

    // Check if user is OAuth-only
    if (resetToken.user.accounts.length > 0 && !resetToken.user.password) {
      await logSecurityEvent(resetToken.userId, 'password_reset_oauth_user', false, { 
        reason: 'OAuth user - cannot set password',
        ipAddress: clientIP,
        userAgent 
      }, request);
      
      return NextResponse.json({
        success: false,
        error: 'This account uses OAuth authentication and cannot have a password set.',
        note: 'Please use your OAuth provider to sign in.'
      }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password and mark token as used
    await prisma.$transaction([
      // Update user password
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
          loginAttempts: 0, // Reset login attempts
          accountLocked: false,
          lockoutUntil: null
        }
      }),
      // Mark token as used
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ]);

    // Log successful password reset
    await logSecurityEvent(resetToken.userId, 'password_reset_success', true, { 
      ipAddress: clientIP,
      userAgent,
      passwordStrength: passwordValidation.score
    }, request);

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully reset.',
      note: 'You can now sign in with your new password.'
    });

  } catch (error: any) {
    console.error('Reset password error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to reset password',
      message: error.message
    }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
