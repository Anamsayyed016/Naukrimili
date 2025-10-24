/**
 * Welcome Email Service for New OAuth Users
 * 
 * Now using Gmail OAuth2 for professional email delivery
 */

import { mailerService } from '@/lib/gmail-oauth2-mailer';

interface WelcomeEmailData {
  email: string;
  name: string;
  provider: 'google' | 'linkedin';
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  try {
    console.log('📧 Sending Welcome Email:', {
      to: data.email,
      name: data.name,
      provider: data.provider,
    });

    // Send actual welcome email using our mailer service
    const emailSent = await mailerService.sendWelcomeEmail(
      data.email,
      data.name || 'User',
      data.provider
    );

    if (emailSent) {
      console.log(`✅ Welcome email sent successfully to ${data.email} (${data.provider})`);
    } else {
      console.warn(`⚠️ Failed to send welcome email to ${data.email}`);
    }

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    // Don't throw error to avoid breaking the OAuth flow
  }
}

/**
 * Generate welcome email HTML template
 */
function generateWelcomeEmailHTML(data: WelcomeEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Naukrimili</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb;">🎉 Welcome to Naukrimili!</h1>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1e293b; margin-top: 0;">Hello ${data.name}!</h2>
        <p style="color: #64748b; line-height: 1.6;">
          Thank you for joining Naukrimili! You've successfully connected your ${data.provider} account 
          and are now ready to explore amazing job opportunities.
        </p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #1e293b;">What's next?</h3>
        <ul style="color: #64748b; line-height: 1.8;">
          <li>Complete your profile to get better job matches</li>
          <li>Upload your resume for AI-powered analysis</li>
          <li>Browse and apply to jobs that match your skills</li>
          <li>Set up job alerts for your preferred roles</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Get Started
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 14px;">
        <p>Best regards,<br>The Naukrimili Team</p>
      </div>
    </body>
    </html>
  `;
}

