/**
 * Postmark Email Service for OTP Authentication
 * Handles secure OTP email delivery via Postmark API
 */

import { ServerClient } from 'postmark';

export interface OTPEmailData {
  to: string;
  otp: string;
  userName?: string;
  purpose: 'login' | 'registration' | 'verification' | 'gmail-oauth';
}

export interface PostmarkConfig {
  serverToken: string;
  fromEmail: string;
  fromName?: string;
}

class PostmarkService {
  private client: ServerClient;
  private fromEmail: string;
  private fromName: string;

  constructor(config: PostmarkConfig) {
    this.client = new ServerClient(config.serverToken);
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName || 'Job Portal';
  }

  /**
   * Send OTP email for authentication
   */
  async sendOTPEmail(data: OTPEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const subject = this.getOTPSubject(data.purpose);
      const htmlBody = this.generateOTPEmailHTML(data);
      const textBody = this.generateOTPEmailText(data);

      const response = await this.client.sendEmail({
        From: `${this.fromName} <${this.fromEmail}>`,
        To: data.to,
        Subject: subject,
        HtmlBody: htmlBody,
        TextBody: textBody,
        MessageStream: 'outbound',
        Tag: 'otp-authentication'
      });

      console.log('✅ OTP email sent successfully:', response.MessageID);
      
      return {
        success: true,
        messageId: response.MessageID
      };
    } catch (error: any) {
      console.error('❌ Failed to send OTP email:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to send OTP email'
      };
    }
  }

  /**
   * Send welcome email after successful OTP verification
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const htmlBody = this.generateWelcomeEmailHTML(userName);
      const textBody = this.generateWelcomeEmailText(userName);

      const response = await this.client.sendEmail({
        From: `${this.fromName} <${this.fromEmail}>`,
        To: email,
        Subject: 'Welcome to Job Portal! 🎉',
        HtmlBody: htmlBody,
        TextBody: textBody,
        MessageStream: 'outbound',
        Tag: 'welcome'
      });

      console.log('✅ Welcome email sent successfully:', response.MessageID);
      
      return {
        success: true,
        messageId: response.MessageID
      };
    } catch (error: any) {
      console.error('❌ Failed to send welcome email:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to send welcome email'
      };
    }
  }

  /**
   * Verify email address with Postmark
   */
  async verifyEmailAddress(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // This would typically be done through Postmark's email verification API
      // For now, we'll do basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Email verification failed:', error);
      
      return {
        success: false,
        error: error.message || 'Email verification failed'
      };
    }
  }

  private getOTPSubject(purpose: string): string {
    const subjects = {
      login: 'Your Login Verification Code',
      registration: 'Verify Your Email Address',
      verification: 'Email Verification Code',
      'gmail-oauth': 'Complete Your Gmail Sign-In'
    };
    
    return subjects[purpose as keyof typeof subjects] || 'Your Verification Code';
  }

  private generateOTPEmailHTML(data: OTPEmailData): string {
    const purposeText = {
      login: 'login to your account',
      registration: 'complete your registration',
      verification: 'verify your email address',
      'gmail-oauth': 'complete your Gmail sign-in'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Verification Code</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-code { background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp-number { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Verification Code</h1>
            <p>Job Portal Security</p>
          </div>
          <div class="content">
            <h2>Hello${data.userName ? ` ${data.userName}` : ''}!</h2>
            <p>You requested a verification code to ${purposeText[data.purpose] || 'verify your account'}.</p>
            
            <div class="otp-code">
              <p style="margin: 0 0 10px 0; color: #666;">Your verification code is:</p>
              <div class="otp-number">${data.otp}</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>This code expires in 10 minutes</li>
                <li>Never share this code with anyone</li>
                <li>If you didn't request this code, please ignore this email</li>
              </ul>
            </div>
            
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>This email was sent by Job Portal. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateOTPEmailText(data: OTPEmailData): string {
    const purposeText = {
      login: 'login to your account',
      registration: 'complete your registration',
      verification: 'verify your email address',
      'gmail-oauth': 'complete your Gmail sign-in'
    };

    return `
🔐 Verification Code - Job Portal

Hello${data.userName ? ` ${data.userName}` : ''}!

You requested a verification code to ${purposeText[data.purpose] || 'verify your account'}.

Your verification code is: ${data.otp}

⚠️ Security Notice:
- This code expires in 10 minutes
- Never share this code with anyone
- If you didn't request this code, please ignore this email

If you have any questions, please contact our support team.

---
This email was sent by Job Portal. Please do not reply to this email.
© ${new Date().getFullYear()} Job Portal. All rights reserved.
    `;
  }

  private generateWelcomeEmailHTML(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Job Portal!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Job Portal!</h1>
            <p>Your account is now verified and ready to use</p>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Congratulations! Your email has been successfully verified and your account is now active.</p>
            
            <p>You can now:</p>
            <ul>
              <li>🔍 Search and apply for jobs</li>
              <li>📝 Upload and manage your resume</li>
              <li>💼 Create your professional profile</li>
              <li>🔔 Get job alerts and notifications</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://aftionix.in'}" class="cta-button">
                Get Started Now
              </a>
            </p>
            
            <p>If you have any questions, our support team is here to help!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmailText(userName: string): string {
    return `
🎉 Welcome to Job Portal!

Hello ${userName}!

Congratulations! Your email has been successfully verified and your account is now active.

You can now:
- 🔍 Search and apply for jobs
- 📝 Upload and manage your resume
- 💼 Create your professional profile
- 🔔 Get job alerts and notifications

Get started: ${process.env.NEXT_PUBLIC_APP_URL || 'https://aftionix.in'}

If you have any questions, our support team is here to help!

---
© ${new Date().getFullYear()} Job Portal. All rights reserved.
    `;
  }
}

// Create singleton instance
let postmarkService: PostmarkService | null = null;

export function getPostmarkService(): PostmarkService {
  if (!postmarkService) {
    const config: PostmarkConfig = {
      serverToken: process.env.POSTMARK_SERVER_TOKEN || '',
      fromEmail: process.env.POSTMARK_FROM_EMAIL || 'noreply@aftionix.in',
      fromName: process.env.POSTMARK_FROM_NAME || 'Job Portal'
    };

    if (!config.serverToken) {
      throw new Error('POSTMARK_SERVER_TOKEN is required');
    }

    postmarkService = new PostmarkService(config);
  }

  return postmarkService;
}

export default PostmarkService;
