import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        isActive: true, 
        isVerified: true 
      }
    });

    // Always return success for security (don't reveal if email exists)
    // This prevents email enumeration attacks
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.',
        note: 'Check your email for reset instructions. If you don\'t receive an email, the address may not be registered.'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.',
        note: 'Your account appears to be deactivated. Please contact support if you need assistance.'
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    try {
      // Create or update password reset token
      await prisma.verificationToken.create({
        data: {
          identifier: `password_reset:${user.email}`,
          token: resetToken,
          expires: resetTokenExpiry
        }
      });
    } catch (tokenError: any) {
      // If token already exists, update it
      if (tokenError.code === 'P2002') { // Unique constraint violation
        await prisma.verificationToken.updateMany({
          where: {
            identifier: `password_reset:${user.email}`
          },
          data: {
            token: resetToken,
            expires: resetTokenExpiry
          }
        });
      } else {
        throw tokenError;
      }
    }

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.name || 'User', resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      
      // Clean up the token if email failed
      await prisma.verificationToken.deleteMany({
        where: {
          identifier: `password_reset:${user.email}`,
          token: resetToken
        }
      });

      return NextResponse.json({
        success: false,
        error: 'Failed to send reset email. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? emailError : undefined
      }, { status: 500 });
    }

    // Log successful password reset request
    console.log(`🔐 Password reset requested for: ${user.email}`);
    
    return NextResponse.json({
      success: true,
      message: 'Password reset link has been sent to your email address.',
      note: 'Please check your email (including spam folder) for reset instructions. The link will expire in 1 hour.',
      ...(process.env.NODE_ENV === 'development' && {
        debugInfo: {
          token: resetToken,
          expiresAt: resetTokenExpiry.toISOString(),
          resetUrl: `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`
        }
      })
    });

  } catch (error: any) {
    console.error('❌ Forgot password error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Please enter a valid email address',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to process password reset request. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Helper function to send password reset email
async function sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  
  // Check if email configuration is available
  if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_USER) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`
        📧 Password Reset Email (Development Mode)
        ==========================================
        To: ${email}
        Name: ${name}
        Subject: Reset Your Password - Job Portal
        
        Hi ${name},
        
        You requested a password reset for your Job Portal account.
        Click the link below to reset your password:
        
        ${resetUrl}
        
        This link will expire in 1 hour for security.
        
        If you didn't request this reset, please ignore this email.
        Your password will remain unchanged.
        
        Best regards,
        Job Portal Team
      `);
      return; // Success in development mode
    } else {
      throw new Error('Email configuration not found');
    }
  }

  // TODO: Implement actual email sending with your preferred service
  // Examples: SendGrid, AWS SES, Nodemailer with SMTP, etc.
  
  /*
  // Example with Nodemailer:
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: process.env.EMAIL_SERVER_PORT === '465',
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD
    }
  });

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
          display: inline-block; 
          background-color: #007bff; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0; 
        }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>You requested a password reset for your Job Portal account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" class="button">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour for security.</p>
        <p>If you didn't request this reset, please ignore this email. Your password will remain unchanged.</p>
        <div class="footer">
          <p>Best regards,<br>Job Portal Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Reset Your Password - Job Portal',
    html: emailHtml,
    text: `
      Hi ${name},
      
      You requested a password reset for your Job Portal account.
      Click the link below to reset your password:
      
      ${resetUrl}
      
      This link will expire in 1 hour for security.
      
      If you didn't request this reset, please ignore this email.
      
      Best regards,
      Job Portal Team
    `
  });
  */

  console.log(`📧 Password reset email would be sent to: ${email}`);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
