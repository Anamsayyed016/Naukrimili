/**
 * Gmail OAuth2 Email Service
 * 
 * Professional email service using Gmail API with OAuth2 authentication
 * Sends emails from naukrimili@naukrimili.com using refresh token
 * 
 * Features:
 * - Gmail API OAuth2 (no password required)
 * - Automatic token refresh
 * - HTML and plain text support
 * - Attachment support
 * - Error handling and logging
 * - Production-ready
 * 
 * Setup:
 * 1. Enable Gmail API in Google Cloud Console
 * 2. Create OAuth2 credentials
 * 3. Generate refresh token
 * 4. Add credentials to .env
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Email configuration interface
interface EmailConfig {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Gmail OAuth2 configuration
interface GmailOAuth2Config {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  sender: string;
  fromName: string;
}

class GmailOAuth2MailerService {
  private oauth2Client: OAuth2Client | null = null;
  private isInitialized = false;
  private config: GmailOAuth2Config | null = null;

  constructor() {
    // Initialize will be called on first use
  }

  /**
   * Get canonical base URL for the application
   */
  private getBaseUrl(): string {
    return (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      (process.env.NODE_ENV === 'production' 
        ? 'https://naukrimili.com' 
        : 'http://localhost:3000')
    );
  }

  /**
   * Initialize Gmail OAuth2 client
   */
  private async initializeClient(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load configuration from environment
      const clientId = process.env.GMAIL_API_CLIENT_ID;
      const clientSecret = process.env.GMAIL_API_CLIENT_SECRET;
      const refreshToken = process.env.GMAIL_API_REFRESH_TOKEN;
      const sender = process.env.GMAIL_SENDER || 'NaukriMili <naukrimili@naukrimili.com>';
      const fromName = process.env.GMAIL_FROM_NAME || 'NaukriMili';

      // Validate required credentials
      if (!clientId || !clientSecret || !refreshToken) {
        console.warn('⚠️ Gmail OAuth2 credentials not configured. Email functionality will be disabled.');
        console.warn('   Required: GMAIL_API_CLIENT_ID, GMAIL_API_CLIENT_SECRET, GMAIL_API_REFRESH_TOKEN');
        console.warn('   Optional: GMAIL_SENDER, GMAIL_FROM_NAME');
        return;
      }

      // Check for placeholder values
      if (clientId.includes('your_') || clientSecret.includes('your_') || refreshToken.includes('your_')) {
        console.warn('⚠️ Gmail OAuth2 credentials contain placeholder values. Please update .env with real credentials.');
        return;
      }

      this.config = {
        clientId,
        clientSecret,
        refreshToken,
        sender,
        fromName
      };

      // Create OAuth2 client
      this.oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'https://developers.google.com/oauthplayground' // Redirect URI
      );

      // Set refresh token
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      // Test the connection by getting an access token
      await this.oauth2Client.getAccessToken();

      this.isInitialized = true;
      
      console.log('✅ Gmail OAuth2 service initialized successfully');
      console.log(`📧 Sender: ${sender}`);
      
    } catch (error: any) {
      console.error('❌ Failed to initialize Gmail OAuth2 service:', error.message);
      this.isInitialized = false;
      this.oauth2Client = null;
    }
  }

  /**
   * Create RFC 2822 formatted email message
   */
  private createEmailMessage(config: EmailConfig): string {
    const to = Array.isArray(config.to) ? config.to.join(', ') : config.to;
    const from = this.config?.sender || 'NaukriMili <naukrimili@naukrimili.com>';
    const subject = config.subject;
    const replyTo = config.replyTo || from;

    // Create message parts
    const messageParts = [
      `From: ${from}`,
      `To: ${to}`,
      `Reply-To: ${replyTo}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
    ];

    // Handle attachments or simple text/html
    if (config.attachments && config.attachments.length > 0) {
      // Multipart message with attachments
      const boundary = `boundary_${Date.now()}`;
      messageParts.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
      messageParts.push('');
      
      // Add text/html content
      messageParts.push(`--${boundary}`);
      if (config.html) {
        messageParts.push('Content-Type: text/html; charset=utf-8');
        messageParts.push('');
        messageParts.push(config.html);
      } else if (config.text) {
        messageParts.push('Content-Type: text/plain; charset=utf-8');
        messageParts.push('');
        messageParts.push(config.text);
      }
      
      // Add attachments
      for (const attachment of config.attachments) {
        messageParts.push(`--${boundary}`);
        messageParts.push(`Content-Type: ${attachment.contentType || 'application/octet-stream'}`);
        messageParts.push('Content-Transfer-Encoding: base64');
        messageParts.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
        messageParts.push('');
        const content = Buffer.isBuffer(attachment.content) 
          ? attachment.content.toString('base64')
          : Buffer.from(attachment.content).toString('base64');
        messageParts.push(content);
      }
      
      messageParts.push(`--${boundary}--`);
    } else {
      // Simple text or html message
      if (config.html) {
        messageParts.push('Content-Type: text/html; charset=utf-8');
        messageParts.push('');
        messageParts.push(config.html);
      } else if (config.text) {
        messageParts.push('Content-Type: text/plain; charset=utf-8');
        messageParts.push('');
        messageParts.push(config.text);
      }
    }

    return messageParts.join('\r\n');
  }

  /**
   * Send email using Gmail API with retry logic
   */
  async sendEmail(config: EmailConfig, retryCount = 0): Promise<boolean> {
    // Initialize if not already done
    if (!this.isInitialized) {
      await this.initializeClient();
    }

    if (!this.isInitialized || !this.oauth2Client) {
      console.warn('⚠️ Gmail OAuth2 service not initialized. Email not sent.');
      return false;
    }

    try {
      // Create Gmail API client
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // Create email message
      const emailMessage = this.createEmailMessage(config);

      // Encode message in base64url format
      const encodedMessage = Buffer.from(emailMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send email
      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      console.log('✅ Email sent successfully via Gmail API:', {
        messageId: result.data.id,
        to: config.to,
        subject: config.subject
      });

      return true;

    } catch (error: any) {
      console.error('❌ Failed to send email via Gmail API:', error.message);
      
      if (error.code === 401) {
        console.error('   Authentication error: Refresh token may be invalid or expired');
        // Try to reinitialize OAuth client
        await this.initializeClient();
      } else if (error.code === 403) {
        console.error('   Permission error: Gmail API may not be enabled or insufficient scopes');
      }

      // Retry once if not already retried
      if (retryCount < 1) {
        console.log(`🔄 Retrying email send (attempt ${retryCount + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        return this.sendEmail(config, retryCount + 1);
      }

      return false;
    }
  }

  /**
   * Send welcome email to new users
   * Professional format without emojis (like LinkedIn/Indeed/Naukri.com)
   */
  async sendWelcomeEmail(to: string, name: string, provider: string): Promise<boolean> {
    const subject = `Welcome to NaukriMili - Your Career Journey Starts Here`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to NaukriMili</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
        
        <!-- Header -->
        <div style="background-color: #2563eb; padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.5px;">
            Welcome to NaukriMili
          </h1>
        </div>
        
        <!-- Content -->
        <div style="background-color: #ffffff; padding: 40px 30px;">
          
          <h2 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 22px; font-weight: 600;">Dear ${name},</h2>
          
          <p style="color: #4b5563; font-size: 16px; margin: 0 0 16px 0; line-height: 1.6;">
            Thank you for registering with <strong>NaukriMili</strong>. Your account has been successfully created and you're now part of India's growing professional network.
          </p>
          
          <p style="color: #4b5563; font-size: 16px; margin: 0 0 25px 0; line-height: 1.6;">
            With NaukriMili, you can access thousands of job opportunities from top companies across multiple industries.
          </p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 20px 25px; margin: 30px 0;">
            <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px; font-size: 18px; font-weight: 600;">Get Started</h3>
            <ul style="color: #4b5563; line-height: 1.8; padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 8px;">Complete your profile to increase visibility</li>
              <li style="margin-bottom: 8px;">Upload your resume for better job matching</li>
              <li style="margin-bottom: 8px;">Browse jobs tailored to your experience</li>
              <li style="margin-bottom: 8px;">Set up job alerts for your preferred roles</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${this.getBaseUrl()}/dashboard" 
               style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">
              Access Your Dashboard
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0; padding-top: 25px; border-top: 1px solid #e5e7eb; line-height: 1.6;">
            If you have any questions or need assistance, please contact our support team at 
            <a href="mailto:support@naukrimili.com" style="color: #2563eb; text-decoration: none;">support@naukrimili.com</a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin: 15px 0 0 0; line-height: 1.6;">
            Best regards,<br>
            <strong>The NaukriMili Team</strong>
          </p>
          
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 25px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
            <strong>NaukriMili</strong> - Connect with Your Next Opportunity
          </p>
          <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} NaukriMili. All rights reserved.
          </p>
          <p style="margin: 0; color: #9ca3af; font-size: 11px;">
            This email was sent to ${to}. If you did not create an account, please ignore this email.
          </p>
        </div>
        
      </body>
      </html>
    `;

    const text = `
Welcome to NaukriMili - Your Career Journey Starts Here

Dear ${name},

Thank you for registering with NaukriMili. Your account has been successfully created and you're now part of India's growing professional network.

With NaukriMili, you can access thousands of job opportunities from top companies across multiple industries.

GET STARTED:
- Complete your profile to increase visibility
- Upload your resume for better job matching
- Browse jobs tailored to your experience
- Set up job alerts for your preferred roles

Access Your Dashboard: ${this.getBaseUrl()}/dashboard

If you have any questions or need assistance, please contact our support team at support@naukrimili.com

Best regards,
The NaukriMili Team

---
© ${new Date().getFullYear()} NaukriMili. All rights reserved.
This email was sent to ${to}. If you did not create an account, please ignore this email.
    `.trim();

    return this.sendEmail({
      to,
      subject,
      html,
      text
    });
  }

  /**
   * Send job application notification
   * Professional format without emojis
   */
  async sendApplicationNotification(to: string, jobTitle: string, companyName: string): Promise<boolean> {
    const subject = `Application Received - ${jobTitle} at ${companyName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Received</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
        
        <div style="background-color: #ffffff; padding: 40px 30px;">
          <div style="border-left: 4px solid #10b981; padding-left: 20px; margin-bottom: 25px;">
            <h2 style="color: #1f2937; margin: 0; font-size: 22px; font-weight: 600;">Application Received</h2>
          </div>
          
          <p style="color: #4b5563; font-size: 16px; margin: 0 0 16px 0; line-height: 1.6;">
            Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been successfully submitted.
          </p>
          
          <p style="color: #4b5563; font-size: 16px; margin: 0 0 25px 0; line-height: 1.6;">
            The employer will review your application shortly. We'll notify you of any updates regarding your application status.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.getBaseUrl()}/dashboard/applications" 
               style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
              Track Application Status
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0; padding-top: 25px; border-top: 1px solid #e5e7eb; line-height: 1.6;">
            Best regards,<br>
            <strong>The NaukriMili Team</strong>
          </p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} NaukriMili. All rights reserved.
          </p>
        </div>
        
      </body>
      </html>
    `;

    const text = `
Application Received - ${jobTitle} at ${companyName}

Dear Applicant,

Your application for ${jobTitle} at ${companyName} has been successfully submitted.

The employer will review your application shortly. We'll notify you of any updates regarding your application status.

Track Application Status: ${this.getBaseUrl()}/dashboard/applications

Best regards,
The NaukriMili Team

---
© ${new Date().getFullYear()} NaukriMili. All rights reserved.
    `.trim();

    return this.sendEmail({
      to,
      subject,
      html,
      text
    });
  }

  /**
   * Send application status update
   * Professional format without emojis
   */
  async sendApplicationStatusUpdate(to: string, jobTitle: string, status: string): Promise<boolean> {
    const statusLabel = status === 'accepted' ? 'Accepted' : status === 'rejected' ? 'Not Selected' : 'Under Review';
    const statusColor = status === 'accepted' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#3b82f6';
    
    const subject = `Application Status Update - ${jobTitle}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Status Update</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
        
        <div style="background-color: #ffffff; padding: 40px 30px;">
          <div style="border-left: 4px solid ${statusColor}; padding-left: 20px; margin-bottom: 25px;">
            <h2 style="color: #1f2937; margin: 0; font-size: 22px; font-weight: 600;">Application Status Update</h2>
          </div>
          
          <p style="color: #4b5563; font-size: 16px; margin: 0 0 16px 0; line-height: 1.6;">
            Your application for <strong>${jobTitle}</strong> has been updated by the employer.
          </p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 25px 0;">
            <p style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0;">
              Current Status: <span style="color: ${statusColor};">${statusLabel}</span>
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.getBaseUrl()}/dashboard/applications" 
               style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
              View Application Details
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0; padding-top: 25px; border-top: 1px solid #e5e7eb; line-height: 1.6;">
            Best regards,<br>
            <strong>The NaukriMili Team</strong>
          </p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} NaukriMili. All rights reserved.
          </p>
        </div>
        
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject,
      html
    });
  }

  /**
   * Send job alert email to users
   * Professional format without emojis
   */
  async sendJobAlertEmail(jobTitle: string, recipientEmail: string, userName?: string): Promise<boolean> {
    const subject = `New Job Alert - ${jobTitle}`;
    const name = userName || 'Valued Professional';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Job Alert - NaukriMili</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
        
        <!-- Header -->
        <div style="background-color: #2563eb; padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.5px;">
            New Job Alert
          </h1>
        </div>
        
        <!-- Content -->
        <div style="background-color: #ffffff; padding: 40px 30px;">
          
          <h2 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 22px; font-weight: 600;">Dear ${name},</h2>
          
          <p style="color: #4b5563; font-size: 16px; margin: 0 0 20px 0; line-height: 1.6;">
            A new job opportunity matching your preferences has been posted on NaukriMili:
          </p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 25px; margin: 30px 0;">
            <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">${jobTitle}</h3>
            <p style="color: #6b7280; margin: 0; font-size: 15px;">Apply now to secure this opportunity before it's filled.</p>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${this.getBaseUrl()}/jobs" 
               style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              View Job Details
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0; padding-top: 25px; border-top: 1px solid #e5e7eb; line-height: 1.6;">
            Visit your dashboard to explore more opportunities tailored to your profile.
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin: 15px 0 0 0; line-height: 1.6;">
            Best regards,<br>
            <strong>The NaukriMili Team</strong>
          </p>
          
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} NaukriMili. All rights reserved.
          </p>
        </div>
        
      </body>
      </html>
    `;

    const text = `
New Job Alert - ${jobTitle}

Dear ${name},

A new job opportunity matching your preferences has been posted on NaukriMili:

${jobTitle}

Apply now to secure this opportunity before it's filled.

View Job Details: ${this.getBaseUrl()}/jobs

Visit your dashboard to explore more opportunities tailored to your profile.

Best regards,
The NaukriMili Team

---
© ${new Date().getFullYear()} NaukriMili. All rights reserved.
    `.trim();

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      text
    });
  }

  /**
   * Send application received email to recruiter
   * Professional format without emojis
   */
  async sendApplicationReceivedEmail(applicantName: string, recruiterEmail: string, jobTitle: string, companyName?: string): Promise<boolean> {
    const subject = `New Application Received - ${jobTitle}`;
    const company = companyName || 'your company';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Application - NaukriMili</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
        
        <!-- Header -->
        <div style="background-color: #10b981; padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.5px;">
            New Application Received
          </h1>
        </div>
        
        <!-- Content -->
        <div style="background-color: #ffffff; padding: 40px 30px;">
          
          <h2 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 22px; font-weight: 600;">Dear Recruiter,</h2>
          
          <p style="color: #4b5563; font-size: 16px; margin: 0 0 20px 0; line-height: 1.6;">
            You have received a new application through NaukriMili for your job posting.
          </p>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 25px; margin: 30px 0;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Application Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #6b7280; padding: 8px 0; font-size: 15px;"><strong>Applicant:</strong></td>
                <td style="color: #1f2937; padding: 8px 0; font-size: 15px;">${applicantName}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 8px 0; font-size: 15px;"><strong>Position:</strong></td>
                <td style="color: #1f2937; padding: 8px 0; font-size: 15px;">${jobTitle}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 8px 0; font-size: 15px;"><strong>Company:</strong></td>
                <td style="color: #1f2937; padding: 8px 0; font-size: 15px;">${company}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${this.getBaseUrl()}/employer/applications" 
               style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Review Application
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0; padding-top: 25px; border-top: 1px solid #e5e7eb; line-height: 1.6;">
            Please review the candidate's profile and resume at your earliest convenience.
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin: 15px 0 0 0; line-height: 1.6;">
            Best regards,<br>
            <strong>The NaukriMili Team</strong>
          </p>
          
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} NaukriMili. All rights reserved.
          </p>
        </div>
        
      </body>
      </html>
    `;

    const text = `
New Application Received - ${jobTitle}

Dear Recruiter,

You have received a new application through NaukriMili for your job posting.

APPLICATION DETAILS:
- Applicant: ${applicantName}
- Position: ${jobTitle}
- Company: ${company}

Review Application: ${this.getBaseUrl()}/employer/applications

Please review the candidate's profile and resume at your earliest convenience.

Best regards,
The NaukriMili Team

---
© ${new Date().getFullYear()} NaukriMili. All rights reserved.
    `.trim();

    return this.sendEmail({
      to: recruiterEmail,
      subject,
      html,
      text
    });
  }

  /**
   * Send custom notification email
   * Professional format without emojis
   */
  async sendCustomNotification(subject: string, body: string, recipientEmail: string, userName?: string): Promise<boolean> {
    const name = userName || 'Valued User';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
        
        <!-- Header -->
        <div style="background-color: #2563eb; padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.5px;">
            Notification from NaukriMili
          </h1>
        </div>
        
        <!-- Content -->
        <div style="background-color: #ffffff; padding: 40px 30px;">
          
          <h2 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 22px; font-weight: 600;">Dear ${name},</h2>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 25px; margin: 30px 0;">
            <div style="color: #4b5563; font-size: 16px; line-height: 1.8;">
              ${body.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${this.getBaseUrl()}/dashboard" 
               style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Visit Your Dashboard
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0; padding-top: 25px; border-top: 1px solid #e5e7eb; line-height: 1.6;">
            Best regards,<br>
            <strong>The NaukriMili Team</strong>
          </p>
          
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} NaukriMili. All rights reserved.
          </p>
        </div>
        
      </body>
      </html>
    `;

    const text = `
${subject}

Dear ${name},

${body}

Visit Your Dashboard: ${this.getBaseUrl()}/dashboard

Best regards,
The NaukriMili Team

---
© ${new Date().getFullYear()} NaukriMili. All rights reserved.
    `.trim();

    return this.sendEmail({
      to: recipientEmail,
      subject: subject,
      html,
      text
    });
  }

  /**
   * Test email delivery with Gmail API endpoint
   */
  async testEmailDelivery(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!this.isReady()) {
      return {
        success: false,
        message: 'Gmail OAuth2 service not initialized'
      };
    }

    try {
      const testConfig: EmailConfig = {
        to: process.env.GMAIL_SENDER?.match(/<(.*?)>/)?.[1] || 'naukrimili@naukrimili.com',
        subject: 'Gmail OAuth2 Test Email - NaukriMili',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 6px; border: 1px solid #e5e7eb;">
              <h2 style="color: #10b981; margin-top: 0;">Gmail OAuth2 Test Successful</h2>
              <p style="color: #4b5563;">This email confirms that your Gmail OAuth2 integration is working correctly.</p>
              <p style="color: #6b7280; font-size: 14px;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <p style="color: #6b7280; font-size: 14px;"><strong>Service:</strong> NaukriMili Gmail OAuth2 Mailer</p>
            </div>
          </body>
          </html>
        `,
        text: `Gmail OAuth2 Test Successful\n\nThis email confirms that your Gmail OAuth2 integration is working correctly.\n\nTimestamp: ${new Date().toISOString()}\nService: NaukriMili Gmail OAuth2 Mailer`
      };

      const result = await this.sendEmail(testConfig);
      
      return {
        success: result,
        message: result ? 'Test email sent successfully' : 'Failed to send test email',
        details: {
          endpoint: 'gmail/v1/users/me/messages/send',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Test email failed: ${error.message}`,
        details: {
          error: error.message,
          code: error.code
        }
      };
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.oauth2Client !== null;
  }

  /**
   * Get service status
   */
  getStatus() {
    const hasCredentials = !!(
      process.env.GMAIL_API_CLIENT_ID &&
      process.env.GMAIL_API_CLIENT_SECRET &&
      process.env.GMAIL_API_REFRESH_TOKEN
    );

    return {
      ready: this.isReady(),
      configured: hasCredentials,
      message: this.isReady() 
        ? 'Gmail OAuth2 service is ready' 
        : hasCredentials 
          ? 'Gmail OAuth2 credentials found but not initialized yet'
          : 'Gmail OAuth2 credentials not configured'
    };
  }

  /**
   * Send company creation confirmation email
   */
  async sendCompanyCreatedEmail(
    to: string, 
    userName: string, 
    companyName: string, 
    industry: string, 
    location: string
  ): Promise<boolean> {
    const subject = `Company Profile Created Successfully! 🏢`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Company Profile Created</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 18px; margin-bottom: 20px; color: #1f2937; }
          .company-info { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .company-info h3 { margin: 0 0 10px; color: #1f2937; font-size: 18px; }
          .company-details { display: grid; gap: 10px; }
          .detail { display: flex; align-items: center; }
          .detail-icon { width: 20px; height: 20px; margin-right: 10px; color: #2563eb; }
          .cta-section { text-align: center; margin: 30px 0; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: transform 0.2s; }
          .cta-button:hover { transform: translateY(-2px); }
          .features { margin: 30px 0; }
          .feature { display: flex; align-items: center; margin: 15px 0; }
          .feature-icon { width: 24px; height: 24px; margin-right: 15px; color: #10b981; }
          .footer { background: #f8fafc; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          .footer a { color: #2563eb; text-decoration: none; }
          .social-links { margin: 20px 0; }
          .social-links a { display: inline-block; margin: 0 10px; color: #6b7280; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏢 Company Profile Created!</h1>
            <p>Your company is now live on NaukriMili</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              <strong>Congratulations ${userName}!</strong>
            </div>
            
            <p>Your company profile has been successfully created and is now live on NaukriMili. You're all set to start attracting top talent!</p>
            
            <div class="company-info">
              <h3>📋 Company Details</h3>
              <div class="company-details">
                <div class="detail">
                  <span class="detail-icon">🏢</span>
                  <strong>Company:</strong> ${companyName}
                </div>
                <div class="detail">
                  <span class="detail-icon">🏭</span>
                  <strong>Industry:</strong> ${industry}
                </div>
                <div class="detail">
                  <span class="detail-icon">📍</span>
                  <strong>Location:</strong> ${location}
                </div>
              </div>
            </div>
            
            <div class="cta-section">
              <a href="https://naukrimili.com/employer/dashboard" class="cta-button">
                🚀 Go to Employer Dashboard
              </a>
            </div>
            
            <div class="features">
              <h3 style="color: #1f2937; margin-bottom: 20px;">🎯 What's Next?</h3>
              
              <div class="feature">
                <span class="feature-icon">📝</span>
                <div>
                  <strong>Post Your First Job</strong><br>
                  <span style="color: #6b7280;">Create compelling job listings to attract qualified candidates</span>
                </div>
              </div>
              
              <div class="feature">
                <span class="feature-icon">👥</span>
                <div>
                  <strong>Manage Applications</strong><br>
                  <span style="color: #6b7280;">Review and shortlist candidates from your dashboard</span>
                </div>
              </div>
              
              <div class="feature">
                <span class="feature-icon">📊</span>
                <div>
                  <strong>Track Performance</strong><br>
                  <span style="color: #6b7280;">Monitor job views, applications, and hiring metrics</span>
                </div>
              </div>
              
              <div class="feature">
                <span class="feature-icon">⭐</span>
                <div>
                  <strong>Build Your Brand</strong><br>
                  <span style="color: #6b7280;">Showcase your company culture and attract top talent</span>
                </div>
              </div>
            </div>
            
            <p style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <strong>💡 Pro Tip:</strong> Complete your company profile with detailed information about your culture, benefits, and mission to attract better candidates and improve your job posting visibility.
            </p>
          </div>
          
          <div class="footer">
            <p><strong>Need Help?</strong></p>
            <p>Our support team is here to help you succeed. Contact us at <a href="mailto:support@naukrimili.com">support@naukrimili.com</a></p>
            
            <div class="social-links">
              <a href="https://linkedin.com/company/naukrimili">LinkedIn</a>
              <a href="https://twitter.com/naukrimili">Twitter</a>
              <a href="https://facebook.com/naukrimili">Facebook</a>
            </div>
            
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
              This email was sent to ${to} because you created a company profile on NaukriMili.<br>
              © 2024 NaukriMili. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Company Profile Created Successfully! 🏢
      
      Congratulations ${userName}!
      
      Your company profile has been successfully created and is now live on NaukriMili. You're all set to start attracting top talent!
      
      Company Details:
      - Company: ${companyName}
      - Industry: ${industry}
      - Location: ${location}
      
      What's Next?
      - Post Your First Job: Create compelling job listings to attract qualified candidates
      - Manage Applications: Review and shortlist candidates from your dashboard
      - Track Performance: Monitor job views, applications, and hiring metrics
      - Build Your Brand: Showcase your company culture and attract top talent
      
      Go to your Employer Dashboard: https://naukrimili.com/employer/dashboard
      
      Need Help?
      Our support team is here to help you succeed. Contact us at support@naukrimili.com
      
      © 2024 NaukriMili. All rights reserved.
    `;

    return await this.sendEmail({
      to,
      subject,
      html,
      text
    });
  }
}

// Export singleton instance
export const mailerService = new GmailOAuth2MailerService();
export default mailerService;

