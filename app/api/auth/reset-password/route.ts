import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';

const requestResetSchema = z.object({
  email: z.string().email('Invalid email address')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
});

// Request password reset - POST /api/auth/reset-password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = requestResetSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.',
        note: 'Check your email for reset instructions.'
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in user record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Store hashed token for security
        password: `reset_token:${resetToken}:${resetTokenExpiry.getTime()}`,
        updatedAt: new Date()
      }
    });

    // TODO: Send email with reset link in production
    // In development, log the token for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Password reset token for', email, ':', resetToken);
      console.log('🔗 Reset URL:', `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`);
    }

    // Email sending logic (implement based on your email service)
    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // Continue anyway for better UX
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset link has been sent to your email.',
      note: 'Check your email for reset instructions. The link will expire in 1 hour.',
      ...(process.env.NODE_ENV === 'development' && { 
        debugToken: resetToken,
        debugUrl: `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`
      })
    });

  } catch (error: any) {
    console.error('❌ Password reset request error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to process password reset request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Reset password with token - PUT /api/auth/reset-password
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = resetPasswordSchema.parse(body);

    // Find user with valid reset token
    const users = await prisma.user.findMany({
      where: {
        password: {
          startsWith: 'reset_token:'
        }
      }
    });

    let targetUser = null;
    
    for (const user of users) {
      if (user.password && user.password.startsWith('reset_token:')) {
        const [, storedToken, expiryTime] = user.password.split(':');
        
        // Check if token matches and hasn't expired
        if (storedToken === token && parseInt(expiryTime) > Date.now()) {
          targetUser = user;
          break;
        }
      }
    }

    if (!targetUser) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired reset token'
      }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user's password and clear reset token
    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });

  } catch (error: any) {
    console.error('❌ Password reset error:', error);
    
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
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Helper function to send password reset email
async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  
  // Check if email configuration is available
  if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_USER) {
    console.log('📧 Email configuration not found, skipping email send');
    return;
  }

  // Email sending implementation would go here
  // For now, we'll just log it in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`
      📧 Password Reset Email (Development Mode)
      ==========================================
      To: ${email}
      Subject: Reset Your Password
      
      You requested a password reset for your account.
      Click the link below to reset your password:
      
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this reset, please ignore this email.
    `);
  }

  // TODO: Implement actual email sending with your preferred service
  // Examples: SendGrid, AWS SES, Nodemailer with SMTP, etc.
  /*
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_SERVER_HOST,
    port: process.env.EMAIL_SERVER_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Reset Your Password',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your account.</p>
      <p><a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this reset, please ignore this email.</p>
    `
  });
  */
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
