import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createVerificationToken } from '@/lib/auth/email-verification';
import { z } from 'zod';

const requestPasswordSetSchema = z.object({
  email: z.string().email('Invalid email address')
});

/**
 * Request Password Set API
 * Generates a secure token and sends email to user for setting password
 * Used for users who originally signed up via Google OAuth
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = requestPasswordSetSchema.parse(body);

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

    // Check if user has Google OAuth account
    const hasGoogleAccount = user.accounts.length > 0;

    if (!hasGoogleAccount) {
      return NextResponse.json(
        { success: false, error: 'This email is not associated with a Google OAuth account' },
        { status: 400 }
      );
    }

    // Check if user already has a password
    if (user.password) {
      return NextResponse.json(
        { success: false, error: 'Password already set. Please sign in with your password.' },
        { status: 400 }
      );
    }

    // Generate secure token (30 minutes expiry)
    const token = await createVerificationToken(email, 0.5); // 0.5 hours = 30 minutes

    // Send password set email
    try {
      const { mailerService } = await import('@/lib/gmail-oauth2-mailer');
      const { getBaseUrl } = await import('@/lib/url-utils');
      
      const baseUrl = getBaseUrl();
      const setPasswordUrl = `${baseUrl}/auth/set-password/${token}`;
      
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Set Your Password - NaukriMili</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Set Your Password</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello ${userName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Your account was created using Google OAuth. To continue using your account with email and password, please set a password by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${setPasswordUrl}" 
                 style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Set Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              This link will expire in 30 minutes. If you didn't request this, please ignore this email.
            </p>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${setPasswordUrl}" style="color: #667eea; word-break: break-all;">${setPasswordUrl}</a>
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
Set Your Password - NaukriMili

Hello ${userName},

Your account was created using Google OAuth. To continue using your account with email and password, please set a password by clicking the link below:

${setPasswordUrl}

This link will expire in 30 minutes. If you didn't request this, please ignore this email.

© ${new Date().getFullYear()} NaukriMili. All rights reserved.
This email was sent to ${email}. If you did not request this, please ignore this email.
      `.trim();

      const sent = await mailerService.sendEmail({
        to: email,
        subject: 'Set Your Password - NaukriMili',
        html,
        text,
        replyTo: 'support@naukrimili.com'
      });

      if (sent) {
        console.log('✅ Password set email sent to:', email);
        return NextResponse.json({
          success: true,
          message: 'Password set email sent successfully. Please check your inbox.'
        });
      } else {
        console.error('❌ Failed to send password set email to:', email);
        return NextResponse.json(
          { success: false, error: 'Failed to send email. Please try again later.' },
          { status: 500 }
        );
      }
    } catch (emailError) {
      console.error('❌ Error sending password set email:', emailError);
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

    console.error('❌ Request password set error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

