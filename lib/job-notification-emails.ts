/**
 * Job Notification Email Service
 * 
 * Sends professional email notifications for job postings to employers and admins
 * Uses Gmail OAuth2 for reliable delivery
 */

import { mailerService } from '@/lib/gmail-oauth2-mailer';

interface JobNotificationData {
  jobTitle: string;
  companyName: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  salary?: string;
  employerEmail: string;
  employerName: string;
  jobId: string;
  jobUrl: string;
  adminEmails?: string[];
}

interface CompanyNotificationData {
  companyName: string;
  industry: string;
  location: string;
  size: string;
  employerEmail: string;
  employerName: string;
  companyId: string;
  companyUrl: string;
}

export class JobNotificationEmailService {
  
  /**
   * Send job posting confirmation email to employer
   */
  async sendJobPostingConfirmation(data: JobNotificationData): Promise<boolean> {
    try {
      console.log('📧 Sending job posting confirmation email to:', data.employerEmail);
      
      const subject = `Job Posted Successfully - ${data.jobTitle}`;
      const htmlContent = this.generateJobConfirmationHTML(data);
      const textContent = this.generateJobConfirmationText(data);
      
      const emailSent = await mailerService.sendEmail({
        to: data.employerEmail,
        subject,
        html: htmlContent,
        text: textContent,
        replyTo: 'naukrimili@naukrimili.com'
      });
      
      if (emailSent) {
        console.log(`✅ Job confirmation email sent successfully to ${data.employerEmail}`);
        return true;
      } else {
        console.warn(`⚠️ Failed to send job confirmation email to ${data.employerEmail}`);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error sending job confirmation email:', error);
      return false;
    }
  }
  
  /**
   * Send job posting notification to admins
   */
  async sendJobPostingNotificationToAdmins(data: JobNotificationData): Promise<boolean> {
    try {
      if (!data.adminEmails || data.adminEmails.length === 0) {
        console.log('📧 No admin emails configured, skipping admin notification');
        return true;
      }
      
      console.log('📧 Sending job posting notification to admins:', data.adminEmails);
      
      const subject = `New Job Posted - ${data.jobTitle} at ${data.companyName}`;
      const htmlContent = this.generateAdminNotificationHTML(data);
      const textContent = this.generateAdminNotificationText(data);
      
      const emailPromises = data.adminEmails.map(adminEmail => 
        mailerService.sendEmail({
          to: adminEmail,
          subject,
          html: htmlContent,
          text: textContent,
          replyTo: 'naukrimili@naukrimili.com'
        })
      );
      
      const results = await Promise.allSettled(emailPromises);
      const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;
      
      console.log(`✅ Admin notification emails sent: ${successCount}/${data.adminEmails.length}`);
      return successCount > 0;
      
    } catch (error) {
      console.error('❌ Error sending admin notification emails:', error);
      return false;
    }
  }
  
  /**
   * Send company creation confirmation email
   */
  async sendCompanyCreationConfirmation(data: CompanyNotificationData): Promise<boolean> {
    try {
      console.log('📧 Sending company creation confirmation email to:', data.employerEmail);
      
      const subject = `Company Profile Created - ${data.companyName}`;
      const htmlContent = this.generateCompanyConfirmationHTML(data);
      const textContent = this.generateCompanyConfirmationText(data);
      
      const emailSent = await mailerService.sendEmail({
        to: data.employerEmail,
        subject,
        html: htmlContent,
        text: textContent,
        replyTo: 'naukrimili@naukrimili.com'
      });
      
      if (emailSent) {
        console.log(`✅ Company confirmation email sent successfully to ${data.employerEmail}`);
        return true;
      } else {
        console.warn(`⚠️ Failed to send company confirmation email to ${data.employerEmail}`);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error sending company confirmation email:', error);
      return false;
    }
  }
  
  /**
   * Generate HTML content for job confirmation email
   */
  private generateJobConfirmationHTML(data: JobNotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Job Posted Successfully</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 30px; border-radius: 12px; }
          .content { background-color: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 20px; }
          .job-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-label { font-weight: bold; color: #374151; }
          .detail-value { color: #6b7280; }
          .cta-button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #94a3b8; font-size: 14px; }
          .success-icon { font-size: 48px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">Job Posted Successfully</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your job posting is now live on NaukriMili</p>
        </div>
        
        <div class="content">
          <h2 style="color: #1e293b; margin-top: 0;">Dear ${data.employerName},</h2>
          <p style="color: #64748b;">Your job posting has been successfully created and is now visible to qualified candidates on our platform.</p>
        </div>
        
        <div class="job-details">
          <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 20px;">Job Details</h3>
          
          <div class="detail-row">
            <span class="detail-label">Job Title:</span>
            <span class="detail-value">${data.jobTitle}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Company:</span>
            <span class="detail-value">${data.companyName}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value">${data.location}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Job Type:</span>
            <span class="detail-value">${data.jobType}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Experience Level:</span>
            <span class="detail-value">${data.experienceLevel}</span>
          </div>
          
          ${data.salary ? `
          <div class="detail-row">
            <span class="detail-label">Salary:</span>
            <span class="detail-value">${data.salary}</span>
          </div>
          ` : ''}
          
          <div class="detail-row">
            <span class="detail-label">Job ID:</span>
            <span class="detail-value">#${data.jobId}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.jobUrl}" class="cta-button">View Your Job Posting</a>
        </div>
        
        <div class="content">
          <h3 style="color: #1e293b;">What's Next?</h3>
          <ul style="color: #64748b;">
            <li><strong>Monitor Applications:</strong> Check your dashboard regularly for new applications</li>
            <li><strong>Review Candidates:</strong> Use our AI-powered matching to find the best candidates</li>
            <li><strong>Communicate:</strong> Respond to candidates promptly to maintain engagement</li>
            <li><strong>Update Posting:</strong> Keep your job description current and engaging</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>Need help? Contact our support team at <a href="mailto:support@naukrimili.com" style="color: #2563eb;">support@naukrimili.com</a></p>
          <p>Best regards,<br><strong>The NaukriMili Team</strong></p>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Generate plain text content for job confirmation email
   */
  private generateJobConfirmationText(data: JobNotificationData): string {
    return `
Job Posted Successfully

Dear ${data.employerName},

Your job posting has been successfully created and is now visible to qualified candidates on our platform.

JOB DETAILS:
- Job Title: ${data.jobTitle}
- Company: ${data.companyName}
- Location: ${data.location}
- Job Type: ${data.jobType}
- Experience Level: ${data.experienceLevel}
${data.salary ? `- Salary: ${data.salary}` : ''}
- Job ID: #${data.jobId}

View your job posting: ${data.jobUrl}

WHAT'S NEXT?
- Monitor Applications: Check your dashboard regularly for new applications
- Review Candidates: Use our AI-powered matching to find the best candidates
- Communicate: Respond to candidates promptly to maintain engagement
- Update Posting: Keep your job description current and engaging

Need help? Contact our support team at support@naukrimili.com

Best regards,
The NaukriMili Team
    `;
  }
  
  /**
   * Generate HTML content for admin notification email
   */
  private generateAdminNotificationHTML(data: JobNotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Job Posted - Admin Notification</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #dc2626, #ea580c); color: white; padding: 30px; border-radius: 12px; }
          .content { background-color: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 20px; }
          .job-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-label { font-weight: bold; color: #374151; }
          .detail-value { color: #6b7280; }
          .cta-button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #94a3b8; font-size: 14px; }
          .alert-icon { font-size: 48px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">New Job Posted</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Admin Notification - Review Required</p>
        </div>
        
        <div class="content">
          <h2 style="color: #1e293b; margin-top: 0;">New Job Posting Alert</h2>
          <p style="color: #64748b;">A new job has been posted on the platform and requires your review.</p>
        </div>
        
        <div class="job-details">
          <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 20px;">Job Information</h3>
          
          <div class="detail-row">
            <span class="detail-label">Job Title:</span>
            <span class="detail-value">${data.jobTitle}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Company:</span>
            <span class="detail-value">${data.companyName}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Employer:</span>
            <span class="detail-value">${data.employerName} (${data.employerEmail})</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value">${data.location}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Job Type:</span>
            <span class="detail-value">${data.jobType}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Experience Level:</span>
            <span class="detail-value">${data.experienceLevel}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Job ID:</span>
            <span class="detail-value">#${data.jobId}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Posted:</span>
            <span class="detail-value">${new Date().toLocaleString()}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.jobUrl}" class="cta-button">Review Job Posting</a>
        </div>
        
        <div class="content">
          <h3 style="color: #1e293b;">Admin Actions</h3>
          <ul style="color: #64748b;">
            <li><strong>Review Content:</strong> Ensure job posting meets platform standards</li>
            <li><strong>Verify Company:</strong> Confirm company legitimacy and details</li>
            <li><strong>Check Compliance:</strong> Ensure posting follows local employment laws</li>
            <li><strong>Monitor Activity:</strong> Track application and engagement metrics</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>Admin Dashboard: <a href="${this.getBaseUrl()}/admin" style="color: #dc2626;">Access Admin Panel</a></p>
          <p>Best regards,<br><strong>NaukriMili System</strong></p>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Generate plain text content for admin notification email
   */
  private generateAdminNotificationText(data: JobNotificationData): string {
    return `
New Job Posted - Admin Notification

A new job has been posted on the platform and requires your review.

JOB INFORMATION:
- Job Title: ${data.jobTitle}
- Company: ${data.companyName}
- Employer: ${data.employerName} (${data.employerEmail})
- Location: ${data.location}
- Job Type: ${data.jobType}
- Experience Level: ${data.experienceLevel}
- Job ID: #${data.jobId}
- Posted: ${new Date().toLocaleString()}

Review job posting: ${data.jobUrl}

ADMIN ACTIONS:
- Review Content: Ensure job posting meets platform standards
- Verify Company: Confirm company legitimacy and details
- Check Compliance: Ensure posting follows local employment laws
- Monitor Activity: Track application and engagement metrics

Admin Dashboard: ${this.getBaseUrl()}/admin

Best regards,
NaukriMili System
    `;
  }
  
  /**
   * Generate HTML content for company confirmation email
   */
  private generateCompanyConfirmationHTML(data: CompanyNotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Company Profile Created</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #059669, #0d9488); color: white; padding: 30px; border-radius: 12px; }
          .content { background-color: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 20px; }
          .company-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-label { font-weight: bold; color: #374151; }
          .detail-value { color: #6b7280; }
          .cta-button { display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #94a3b8; font-size: 14px; }
          .success-icon { font-size: 48px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="success-icon">🏢</div>
          <h1 style="margin: 0; font-size: 28px;">Company Profile Created!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Welcome to NaukriMili Employer Portal</p>
        </div>
        
        <div class="content">
          <h2 style="color: #1e293b; margin-top: 0;">Hello ${data.employerName}!</h2>
          <p style="color: #64748b;">Congratulations! Your company profile has been successfully created and is now live on NaukriMili. You can now start posting jobs and attracting top talent.</p>
        </div>
        
        <div class="company-details">
          <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 20px;">🏢 Company Details</h3>
          
          <div class="detail-row">
            <span class="detail-label">Company Name:</span>
            <span class="detail-value">${data.companyName}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Industry:</span>
            <span class="detail-value">${data.industry}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value">${data.location}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Company Size:</span>
            <span class="detail-value">${data.size}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Company ID:</span>
            <span class="detail-value">#${data.companyId}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.companyUrl}" class="cta-button">View Company Profile</a>
        </div>
        
        <div class="content">
          <h3 style="color: #1e293b;">Ready to Hire?</h3>
          <ul style="color: #64748b;">
            <li><strong>Post Your First Job:</strong> Create compelling job postings with AI assistance</li>
            <li><strong>Attract Talent:</strong> Use our platform to reach qualified candidates</li>
            <li><strong>Manage Applications:</strong> Review and respond to applications efficiently</li>
            <li><strong>Build Your Brand:</strong> Showcase your company culture and values</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>Need help getting started? Contact our support team at <a href="mailto:support@naukrimili.com" style="color: #059669;">support@naukrimili.com</a></p>
          <p>Best regards,<br><strong>The NaukriMili Team</strong></p>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Generate plain text content for company confirmation email
   */
  private generateCompanyConfirmationText(data: CompanyNotificationData): string {
    return `
🏢 Company Profile Created!

Hello ${data.employerName}!

Congratulations! Your company profile has been successfully created and is now live on NaukriMili. You can now start posting jobs and attracting top talent.

COMPANY DETAILS:
- Company Name: ${data.companyName}
- Industry: ${data.industry}
- Location: ${data.location}
- Company Size: ${data.size}
- Company ID: #${data.companyId}

View company profile: ${data.companyUrl}

READY TO HIRE?
- Post Your First Job: Create compelling job postings with AI assistance
- Attract Talent: Use our platform to reach qualified candidates
- Manage Applications: Review and respond to applications efficiently
- Build Your Brand: Showcase your company culture and values

Need help getting started? Contact our support team at support@naukrimili.com

Best regards,
The NaukriMili Team
    `;
  }
}

// Export singleton instance
export const jobNotificationEmailService = new JobNotificationEmailService();
