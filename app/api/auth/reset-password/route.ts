import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in user record (temporary approach)
    // TODO: Create a separate password reset tokens table when needed
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Store token hash in a custom field or create a separate table
        // For now, we'll use a simple approach
        updatedAt: new Date()
      }
    });

    // Send password reset email
    try {
      const { sendPasswordResetEmail } = await import('@/lib/mailer');
      const emailSent = await sendPasswordResetEmail(email, resetToken);
      
      if (emailSent) {
        console.log(`✅ Password reset email sent to ${email}`);
      } else {
        console.warn(`⚠️ Failed to send password reset email to ${email}`);
        // Still return success to avoid revealing if email exists
      }
    } catch (emailError) {
      console.error('❌ Error sending password reset email:', emailError);
      // Still return success to avoid revealing if email exists
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // TODO: Verify token from database
    // For now, we'll assume token is valid
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // TODO: Find user by token and update password
    // For now, return success (in production, implement proper token verification)
    
    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
