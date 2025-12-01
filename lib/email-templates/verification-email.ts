/**
 * Email Verification Template
 * Generates HTML email for email address verification
 */

/**
 * Generate email verification HTML template
 * @param name - User's first name
 * @param verificationUrl - Full verification URL with token
 * @param email - User's email address
 */
export function generateVerificationEmailHTML(
  name: string,
  verificationUrl: string,
  email: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - NaukriMili</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  
  <!-- Header -->
  <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 12px 12px 0 0;">
    <div style="background-color: white; width: 60px; height: 60px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <span style="font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">N</span>
    </div>
    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">
      Verify Your Email Address
    </h1>
  </div>
  
  <!-- Content -->
  <div style="background-color: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
    
    <h2 style="color: #1f2937; margin-top: 0; font-size: 22px;">Dear ${name},</h2>
    
    <p style="color: #4b5563; font-size: 16px; margin: 20px 0; line-height: 1.6;">
      Thank you for registering with <strong>NaukriMili</strong>! To complete your registration and activate your account, 
      please verify your email address.
    </p>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 6px;">
      <p style="color: #1e40af; margin: 0; font-size: 15px;">
        <strong>Email Address:</strong> ${email}
      </p>
    </div>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 35px 0;">
      <a href="${verificationUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); transition: all 0.3s ease;">
        Verify Email Address
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin: 25px 0; text-align: center;">
      Or copy and paste this link into your browser:
    </p>
    
    <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all; text-align: center; margin: 15px 0;">
      <a href="${verificationUrl}" style="color: #3b82f6; font-size: 13px; text-decoration: none;">
        ${verificationUrl}
      </a>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 6px;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        <strong>Important:</strong> This verification link will expire in 24 hours.
      </p>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin: 25px 0;">
      If you didn't create an account with NaukriMili, you can safely ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <!-- Footer -->
    <div style="text-align: center; color: #9ca3af; font-size: 13px;">
      <p style="margin: 10px 0;">
        <strong style="color: #4b5563;">NaukriMili</strong> - India's AI-Powered Job Portal
      </p>
      <p style="margin: 5px 0;">
        © ${new Date().getFullYear()} NaukriMili. All rights reserved.
      </p>
      <p style="margin: 15px 0;">
        <a href="https://naukrimili.com/privacy" style="color: #6b7280; text-decoration: none; margin: 0 8px;">Privacy Policy</a>
        <span style="color: #d1d5db;">•</span>
        <a href="https://naukrimili.com/terms" style="color: #6b7280; text-decoration: none; margin: 0 8px;">Terms of Service</a>
      </p>
    </div>
    
  </div>
  
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of verification email
 */
export function generateVerificationEmailText(
  name: string,
  verificationUrl: string,
  email: string
): string {
  return `
Hello ${name}!

Thank you for registering with NaukriMili!

Please verify your email address to activate your account:

Email: ${email}

Verification Link:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with NaukriMili, you can safely ignore this email.

---
© ${new Date().getFullYear()} NaukriMili - India's AI-Powered Job Portal
Privacy Policy: https://naukrimili.com/privacy
Terms of Service: https://naukrimili.com/terms
  `.trim();
}

/**
 * Send verification email using Gmail OAuth2 service
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  try {
    const { mailerService } = await import('@/lib/gmail-oauth2-mailer');
    const { getBaseUrl } = await import('@/lib/url-utils');
    
    // Generate verification URL using canonical base URL
    const baseUrl = getBaseUrl();
    const verificationUrl = `${baseUrl}/auth/verify-email/${token}`;
    
    // Generate email content
    const html = generateVerificationEmailHTML(name, verificationUrl, email);
    const text = generateVerificationEmailText(name, verificationUrl, email);
    
    // Send email
    const sent = await mailerService.sendEmail({
      to: email,
      subject: 'Verify Your Email Address - NaukriMili',
      html,
      text,
      replyTo: 'support@naukrimili.com'
    });
    
    if (sent) {
      console.log('✅ Verification email sent to:', email);
    } else {
      console.error('❌ Failed to send verification email to:', email);
    }
    
    return sent;
    
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return false;
  }
}

