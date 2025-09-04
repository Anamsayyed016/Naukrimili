/**
 * Welcome Email Service for New OAuth Users
 * 
 * This is a placeholder implementation for sending welcome emails to new users.
 * Currently, no email service is configured in the project, so this function
 * only logs the welcome email details.
 * 
 * To implement actual email sending, you would need to:
 * 1. Install an email service (Nodemailer, SendGrid, Resend, etc.)
 * 2. Configure SMTP settings or API keys
 * 3. Replace the console.log with actual email sending logic
 */

interface WelcomeEmailData {
  email: string;
  name: string;
  provider: 'google' | 'linkedin';
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  try {
    // Log the welcome email details (replace with actual email sending)
    console.log('📧 Welcome Email (Placeholder):', {
      to: data.email,
      subject: 'Welcome to Naukrimili! 🎉',
      template: 'welcome-oauth',
      data: {
        name: data.name,
        provider: data.provider,
        loginUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      }
    });

    // TODO: Implement actual email sending
    // Example with Nodemailer:
    // await transporter.sendMail({
    //   from: process.env.FROM_EMAIL,
    //   to: data.email,
    //   subject: 'Welcome to Naukrimili! 🎉',
    //   html: generateWelcomeEmailHTML(data)
    // });

    // Example with SendGrid:
    // await sgMail.send({
    //   to: data.email,
    //   from: process.env.FROM_EMAIL,
    //   subject: 'Welcome to Naukrimili! 🎉',
    //   html: generateWelcomeEmailHTML(data)
    // });

    console.log(`✅ Welcome email logged for ${data.email} (${data.provider})`);
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

