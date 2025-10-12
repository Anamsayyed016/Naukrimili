/**
 * Gmail SMTP Email Service
 * 
 * This service provides email sending functionality using Gmail SMTP
 * and integrates seamlessly with the existing Socket.io notification system.
 * 
 * Features:
 * - Gmail SMTP with SSL/TLS support
 * - Environment variable configuration
 * - Error handling and logging
 * - HTML and plain text support
 * - Integration with notification system
 */

import nodemailer from 'nodemailer';

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

// SMTP configuration interface
interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class MailerService {
  private transporter: nodemailer.Transporter | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize the SMTP transporter with Gmail configuration
   */
  private async initializeTransporter(): Promise<void> {
    try {
      const smtpConfig: SMTPConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      };

      // Validate required environment variables
      if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
        console.warn('⚠️ SMTP credentials not configured. Email functionality will be disabled.');
        console.warn('Please set SMTP_USER and SMTP_PASS environment variables.');
        return;
      }

      // Create transporter
      this.transporter = nodemailer.createTransporter(smtpConfig);

      // Verify connection
      await this.transporter.verify();
      this.isInitialized = true;
      
      console.log('✅ Gmail SMTP service initialized successfully');
      console.log(`📧 SMTP Config: ${smtpConfig.host}:${smtpConfig.port} (secure: ${smtpConfig.secure})`);
      
    } catch (error) {
      console.error('❌ Failed to initialize SMTP service:', error);
      this.isInitialized = false;
      this.transporter = null;
    }
  }

  /**
   * Send email with the configured SMTP settings
   */
  async sendEmail(config: EmailConfig): Promise<boolean> {
    if (!this.isInitialized || !this.transporter) {
      console.warn('⚠️ SMTP service not initialized. Email not sent.');
      return false;
    }

    try {
      // Prepare email options
      const mailOptions = {
        from: {
          name: process.env.SMTP_FROM_NAME || 'Aftionix Job Portal',
          address: process.env.SMTP_USER || process.env.SMTP_FROM_EMAIL || ''
        },
        to: Array.isArray(config.to) ? config.to.join(', ') : config.to,
        subject: config.subject,
        text: config.text,
        html: config.html,
        replyTo: config.replyTo,
        attachments: config.attachments
      };

      // Send email
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully:', {
        messageId: result.messageId,
        to: config.to,
        subject: config.subject
      });

      return true;

    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(email: string, name: string, provider: string): Promise<boolean> {
    const subject = 'Welcome to Aftionix Job Portal! 🎉';
    const text = `Hi ${name},\n\nWelcome to Aftionix Job Portal! You've successfully signed up using ${provider}.\n\nStart exploring opportunities that match your skills and career goals.\n\nBest regards,\nThe Aftionix Team`;
    
    const html = this.generateWelcomeEmailHTML(name, provider);

    return await this.sendEmail({
      to: email,
      subject,
      text,
      html
    });
  }

  /**
   * Send job application notification email
   */
  async sendApplicationNotificationEmail(
    employerEmail: string, 
    employerName: string, 
    jobTitle: string, 
    applicantName: string
  ): Promise<boolean> {
    const subject = `New Application for ${jobTitle}`;
    const text = `Hi ${employerName},\n\nYou have received a new application for the position: ${jobTitle}\n\nApplicant: ${applicantName}\n\nPlease check your dashboard to view the complete application.\n\nBest regards,\nAftionix Job Portal`;
    
    const html = this.generateApplicationNotificationHTML(employerName, jobTitle, applicantName);

    return await this.sendEmail({
      to: employerEmail,
      subject,
      text,
      html
    });
  }

  /**
   * Send application status update email
   */
  async sendApplicationStatusEmail(
    applicantEmail: string,
    applicantName: string,
    jobTitle: string,
    status: string,
    companyName: string
  ): Promise<boolean> {
    const subject = `Application Status Update: ${jobTitle}`;
    const text = `Hi ${applicantName},\n\nYour application status for ${jobTitle} at ${companyName} has been updated to: ${status}\n\nPlease check your dashboard for more details.\n\nBest regards,\nAftionix Job Portal`;
    
    const html = this.generateApplicationStatusHTML(applicantName, jobTitle, status, companyName);

    return await this.sendEmail({
      to: applicantEmail,
      subject,
      text,
      html
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset?token=${resetToken}`;
    const subject = 'Password Reset - Aftionix Job Portal';
    const text = `You requested a password reset for your Aftionix account.\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nAftionix Team`;
    
    const html = this.generatePasswordResetHTML(resetUrl);

    return await this.sendEmail({
      to: email,
      subject,
      text,
      html
    });
  }

  /**
   * Generate HTML template for welcome email
   */
  private generateWelcomeEmailHTML(name: string, provider: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Aftionix</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Aftionix!</h1>
            <p>Your journey to the perfect job starts here</p>
          </div>
          <div class="content">
            <h2>Hi ${name}!</h2>
            <p>Welcome to <strong>Aftionix Job Portal</strong>! You've successfully signed up using <strong>${provider}</strong>.</p>
            <p>We're excited to help you find your next career opportunity. Here's what you can do:</p>
            <ul>
              <li>🔍 Browse thousands of job opportunities</li>
              <li>📝 Create a professional profile</li>
              <li>💼 Apply to jobs that match your skills</li>
              <li>🔔 Get real-time notifications about applications</li>
            </ul>
            <div style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Get Started</a>
            </div>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Aftionix Team</p>
            <p><a href="${process.env.NEXTAUTH_URL}">Visit Aftionix</a> | <a href="${process.env.NEXTAUTH_URL}/contact">Contact Us</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML template for application notification
   */
  private generateApplicationNotificationHTML(employerName: string, jobTitle: string, applicantName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Application Received</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .highlight { background: #e8f4fd; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 New Application Received</h1>
            <p>Someone is interested in your job posting</p>
          </div>
          <div class="content">
            <h2>Hi ${employerName}!</h2>
            <p>Great news! You have received a new application for one of your job postings.</p>
            <div class="highlight">
              <h3>Application Details:</h3>
              <p><strong>Job Title:</strong> ${jobTitle}</p>
              <p><strong>Applicant:</strong> ${applicantName}</p>
            </div>
            <p>Please review the application and take action as needed. You can also communicate with the applicant directly through our messaging system.</p>
            <div style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL}/employer/applications" class="button">View Application</a>
            </div>
          </div>
          <div class="footer">
            <p>Best regards,<br>Aftionix Job Portal</p>
            <p><a href="${process.env.NEXTAUTH_URL}">Visit Aftionix</a> | <a href="${process.env.NEXTAUTH_URL}/contact">Contact Us</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML template for application status update
   */
  private generateApplicationStatusHTML(applicantName: string, jobTitle: string, status: string, companyName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .status { background: #e8f4fd; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Application Status Update</h1>
            <p>Your application status has been updated</p>
          </div>
          <div class="content">
            <h2>Hi ${applicantName}!</h2>
            <p>We have an update regarding your job application.</p>
            <div class="status">
              <h3>Status Update:</h3>
              <p><strong>Job Title:</strong> ${jobTitle}</p>
              <p><strong>Company:</strong> ${companyName}</p>
              <p><strong>New Status:</strong> ${status}</p>
            </div>
            <p>Please check your dashboard for more details and any next steps.</p>
            <div style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard/jobseeker/applications" class="button">View Application</a>
            </div>
          </div>
          <div class="footer">
            <p>Best regards,<br>Aftionix Job Portal</p>
            <p><a href="${process.env.NEXTAUTH_URL}">Visit Aftionix</a> | <a href="${process.env.NEXTAUTH_URL}/contact">Contact Us</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML template for password reset
   */
  private generatePasswordResetHTML(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
            <p>Reset your Aftionix account password</p>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your Aftionix account. Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <div class="warning">
              <p><strong>Important:</strong></p>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will remain unchanged until you click the link above</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Aftionix Team</p>
            <p><a href="${process.env.NEXTAUTH_URL}">Visit Aftionix</a> | <a href="${process.env.NEXTAUTH_URL}/contact">Contact Us</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Check if the mailer service is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.transporter !== null;
  }

  /**
   * Get service status
   */
  getStatus(): { ready: boolean; configured: boolean } {
    return {
      ready: this.isReady(),
      configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
    };
  }
}

// Create singleton instance
const mailerService = new MailerService();

// Export the service and utility functions
export { mailerService };
export default mailerService;

// Utility function for easy email sending
export async function sendEmail(config: EmailConfig): Promise<boolean> {
  return await mailerService.sendEmail(config);
}

// Utility functions for common email types
export async function sendWelcomeEmail(email: string, name: string, provider: string): Promise<boolean> {
  return await mailerService.sendWelcomeEmail(email, name, provider);
}

export async function sendApplicationNotificationEmail(
  employerEmail: string, 
  employerName: string, 
  jobTitle: string, 
  applicantName: string
): Promise<boolean> {
  return await mailerService.sendApplicationNotificationEmail(employerEmail, employerName, jobTitle, applicantName);
}

export async function sendApplicationStatusEmail(
  applicantEmail: string,
  applicantName: string,
  jobTitle: string,
  status: string,
  companyName: string
): Promise<boolean> {
  return await mailerService.sendApplicationStatusEmail(applicantEmail, applicantName, jobTitle, status, companyName);
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  return await mailerService.sendPasswordResetEmail(email, resetToken);
}
