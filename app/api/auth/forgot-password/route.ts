import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Forgot password schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Reset password schema
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'forgot') {
      const validatedData = forgotPasswordSchema.parse(body);

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: validatedData.email },
        select: { id: true, email: true, name: true }
      });

      if (!user) {
        // Don't reveal if email exists for security reasons
        return NextResponse.json({
          success: true,
          message: 'If an account with this email exists, you will receive a password reset link.',
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store reset token (in a real app, you'd have a separate table for this)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          // In a real implementation, you'd add these fields to the User model
          // resetToken,
          // resetTokenExpiry,
          updatedAt: new Date(),
        }
      });

      // In a real implementation, you'd send an email here
      console.log(`Password reset token for ${user.email}: ${resetToken}`);

      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link.',
        // For demo purposes, include the token (remove in production)
        resetToken: resetToken,
      });

    } else if (action === 'reset') {
      const validatedData = resetPasswordSchema.parse(body);

      // In a real implementation, you'd verify the token against the database
      // For now, we'll simulate token validation
      if (!validatedData.token || validatedData.token.length < 32) {
        return NextResponse.json({
          success: false,
          error: 'Invalid or expired reset token',
        }, { status: 400 });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);

      // For demo purposes, we'll update the first user's password
      // In a real implementation, you'd find the user by the reset token
      const updatedUser = await prisma.user.findFirst({
        select: { id: true, email: true }
      });

      if (!updatedUser) {
        return NextResponse.json({
          success: false,
          error: 'Invalid or expired reset token',
        }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: updatedUser.id },
        data: {
          password: hashedPassword,
          // resetToken: null,
          // resetTokenExpiry: null,
          updatedAt: new Date(),
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Password has been reset successfully. You can now login with your new password.',
      });

    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action',
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Forgot password error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to process password reset request',
      message: error.message,
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
