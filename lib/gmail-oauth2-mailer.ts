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

import 'server-only';
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
   */
  async sendWelcomeEmail(to: string, name: string, provider: string): Promise<boolean> {
    const subject = `Welcome to NaukriMili! 🎉`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to NaukriMili</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px 10px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
            🎉 Welcome to NaukriMili!
          </h1>
        </div>
        
        <!-- Content -->
        <div style="background-color: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          
          <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">Hello ${name}! 👋</h2>
          
          <p style="color: #4b5563; font-size: 16px; margin: 20px 0;">
            Thank you for joining <strong>NaukriMili</strong>! You've successfully connected your ${provider} account 
            and are now ready to explore amazing job opportunities.
          </p>
          
          <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 20px;">🚀 What's next?</h3>
            <ul style="color: #4b5563; line-height: 1.8; padding-left: 20px;">
              <li>Complete your profile to get better job matches</li>
              <li>Upload your resume for AI-powered analysis</li>
              <li>Browse and apply to jobs that match your skills</li>
              <li>Set up job alerts for your preferred roles</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'https://naukrimili.com'}/dashboard" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
              Get Started →
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            Need help? Reply to this email or visit our <a href="${process.env.NEXTAUTH_URL || 'https://naukrimili.com'}/support" style="color: #667eea; text-decoration: none;">support center</a>.
          </p>
          
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 13px;">
          <p style="margin: 5px 0;">
            <strong>NaukriMili</strong> - Your Career Partner
          </p>
          <p style="margin: 5px 0;">
            © ${new Date().getFullYear()} NaukriMili. All rights reserved.
          </p>
        </div>
        
      </body>
      </html>
    `;

    const text = `
Welcome to NaukriMili! 🎉

Hello ${name}!

Thank you for joining NaukriMili! You've successfully connected your ${provider} account 
and are now ready to explore amazing job opportunities.

What's next?
- Complete your profile to get better job matches
- Upload your resume for AI-powered analysis
- Browse and apply to jobs that match your skills
- Set up job alerts for your preferred roles

Get Started: ${process.env.NEXTAUTH_URL || 'https://naukrimili.com'}/dashboard

Need help? Reply to this email or visit our support center.

Best regards,
The NaukriMili Team
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
   */
  async sendApplicationNotification(to: string, jobTitle: string, companyName: string): Promise<boolean> {
    const subject = `Application Received: ${jobTitle} at ${companyName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Application Received</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8fafc; padding: 30px; border-radius: 10px;">
          <h2 style="color: #1e293b; margin-top: 0;">✅ Application Received!</h2>
          <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
            Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been successfully submitted.
          </p>
          <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
            We'll notify you when the employer reviews your application.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL || 'https://naukrimili.com'}/dashboard/applications" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Application Status
            </a>
          </div>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 13px; margin-top: 30px;">
          NaukriMili - Your Career Partner
        </p>
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
   * Send application status update
   */
  async sendApplicationStatusUpdate(to: string, jobTitle: string, status: string): Promise<boolean> {
    const statusEmoji = status === 'accepted' ? '🎉' : status === 'rejected' ? '📋' : '📝';
    const statusColor = status === 'accepted' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#3b82f6';
    
    const subject = `Application Update: ${jobTitle}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Application Status Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8fafc; padding: 30px; border-radius: 10px; border-left: 4px solid ${statusColor};">
          <h2 style="color: #1e293b; margin-top: 0;">${statusEmoji} Application Status Update</h2>
          <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
            Your application for <strong>${jobTitle}</strong> has been updated.
          </p>
          <p style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 20px 0;">
            Status: <span style="color: ${statusColor};">${status.toUpperCase()}</span>
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL || 'https://naukrimili.com'}/dashboard/applications" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Details
            </a>
          </div>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 13px; margin-top: 30px;">
          NaukriMili - Your Career Partner
        </p>
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
   */
  async sendJobAlertEmail(jobTitle: string, recipientEmail: string, userName?: string): Promise<boolean> {
    const subject = `🔔 New Job Alert: ${jobTitle}`;
    const name = userName || 'there';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Job Alert - NaukriMili</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px 10px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
            🔔 New Job Alert!
          </h1>
        </div>
        
        <!-- Content -->
        <div style="background-color: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          
          <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">Hello ${name}! 👋</h2>
          
          <p style="color: #4b5563; font-size: 16px; margin: 20px 0;">
            Great news! A new job matching your preferences has been posted:
          </p>
          
          <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 30px 0; text-align: center;">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 20px;">${jobTitle}</h3>
            <p style="color: #4b5563; margin-bottom: 0;">Check out this opportunity on NaukriMili!</p>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'https://naukrimili.com'}/jobs" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
              View Job Details →
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 40px;">
            Keep an eye on your dashboard for more opportunities!
          </p>
          
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 14px;">
          <p>Best regards,<br><strong>The NaukriMili Team</strong></p>
        </div>
        
      </body>
      </html>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html
    });
  }

  /**
   * Send application received email to recruiter
   */
  async sendApplicationReceivedEmail(applicantName: string, recruiterEmail: string, jobTitle: string, companyName?: string): Promise<boolean> {
    const subject = `📨 New Application Received - ${jobTitle}`;
    const company = companyName || 'your company';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Application - NaukriMili</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 10px 10px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
            📨 New Application Received!
          </h1>
        </div>
        
        <!-- Content -->
        <div style="background-color: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          
          <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">Hello Recruiter! 👋</h2>
          
          <p style="color: #4b5563; font-size: 16px; margin: 20px 0;">
            You have received a new job application for your posted position.
          </p>
          
          <div style="background-color: #f0fdf4; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 20px;">Application Details:</h3>
            <ul style="color: #4b5563; line-height: 1.8; padding-left: 20px; margin: 0;">
              <li><strong>Applicant:</strong> ${applicantName}</li>
              <li><strong>Position:</strong> ${jobTitle}</li>
              <li><strong>Company:</strong> ${company}</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'https://naukrimili.com'}/dashboard/recruiter/applications" 
               style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.4);">
              View Application →
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 40px;">
            Review the application and take action to move forward with the candidate.
          </p>
          
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 14px;">
          <p>Best regards,<br><strong>The NaukriMili Team</strong></p>
        </div>
        
      </body>
      </html>
    `;

    return this.sendEmail({
      to: recruiterEmail,
      subject,
      html
    });
  }

  /**
   * Send custom notification email
   */
  async sendCustomNotification(subject: string, body: string, recipientEmail: string, userName?: string): Promise<boolean> {
    const name = userName || 'there';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px 10px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
            📬 Notification
          </h1>
        </div>
        
        <!-- Content -->
        <div style="background-color: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          
          <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">Hello ${name}! 👋</h2>
          
          <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 30px 0;">
            <div style="color: #4b5563; font-size: 16px; line-height: 1.8;">
              ${body.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'https://naukrimili.com'}/dashboard" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
              Visit Dashboard →
            </a>
          </div>
          
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 14px;">
          <p>Best regards,<br><strong>The NaukriMili Team</strong></p>
        </div>
        
      </body>
      </html>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject: `📬 ${subject}`,
      html
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
        subject: '🧪 Gmail OAuth2 Test Email',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>✅ Gmail OAuth2 Test Successful!</h2>
            <p>This email confirms that your Gmail OAuth2 integration is working correctly.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Service:</strong> NaukriMili Gmail OAuth2 Mailer</p>
          </div>
        `
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
}

// Export singleton instance
export const mailerService = new GmailOAuth2MailerService();
export default mailerService;

