import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createVerificationToken } from '@/lib/auth/email-verification';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

/**
 * Forgot Password API
 * Generates a secure token and sends email to user for resetting password
 * Used for users who already have a password and forgot it
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Check if user has a password set (required for password reset)
    if (!user.password) {
      // User doesn't have a password - might be OAuth-only user
      // Still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate secure token (1 hour expiry for password reset)
    const token = await createVerificationToken(email, 1); // 1 hour expiry

    // Send password reset email
    try {
      const { mailerService } = await import('@/lib/gmail-oauth2-mailer');
      const { getBaseUrl } = await import('@/lib/url-utils');
      
      const baseUrl = getBaseUrl();
      const resetPasswordUrl = `${baseUrl}/auth/reset-password/${token}`;
      
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - NaukriMili</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Reset Your Password</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello ${userName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetPasswordUrl}" 
                 style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              This link will expire in 1 hour. If you didn't request this, please ignore this email. Your password will remain unchanged.
            </p>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetPasswordUrl}" style="color: #667eea; word-break: break-all;">${resetPasswordUrl}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              © ${new Date().getFullYear()} NaukriMili. All rights reserved.<br>
              This email was sent to ${email}. If you did not request this, please ignore this email.
            </p>
          </div>
        </body>
        </html>
      `;

      const text = `
Reset Your Password - NaukriMili

Hello ${userName},

We received a request to reset your password. Click the link below to create a new password:

${resetPasswordUrl}

This link will expire in 1 hour. If you didn't request this, please ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} NaukriMili. All rights reserved.
This email was sent to ${email}. If you did not request this, please ignore this email.
      `.trim();

      const sent = await mailerService.sendEmail({
        to: email,
        subject: 'Reset Your Password - NaukriMili',
        html,
        text,
        replyTo: 'support@naukrimili.com'
      });

      if (sent) {
        console.log('✅ Password reset email sent to:', email);
        return NextResponse.json({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.'
        });
      } else {
        console.error('❌ Failed to send password reset email to:', email);
        return NextResponse.json(
          { success: false, error: 'Failed to send email. Please try again later.' },
          { status: 500 }
        );
      }
    } catch (emailError) {
      console.error('❌ Error sending password reset email:', emailError);
      return NextResponse.json(
        { success: false, error: 'Failed to send email. Please try again later.' },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('❌ Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

