import nodemailer from 'nodemailer';

export type EmailPayload = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string; path?: string }>
};

/**
 * Send email using SMTP (cPanel) with fallback to Gmail OAuth2
 * 
 * Priority:
 * 1. SMTP (cPanel email) if configured
 * 2. Gmail OAuth2 if SMTP fails or not configured
 * 
 * Note: Email sending is optional. If neither SMTP nor Gmail OAuth2 is configured,
 * emails will be skipped gracefully without breaking the application.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  // Check if SMTP is configured
  const hasSmtpConfig = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

  // Try SMTP first if configured
  if (hasSmtpConfig) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates
        },
      });

      const mailOptions: any = {
        from: process.env.SMTP_FROM_EMAIL 
          ? `${process.env.SMTP_FROM_NAME || 'NaukriMili'} <${process.env.SMTP_FROM_EMAIL}>`
          : process.env.SMTP_USER,
        to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        replyTo: payload.replyTo,
      };

      // Handle attachments
      if (payload.attachments && payload.attachments.length > 0) {
        mailOptions.attachments = payload.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          path: att.path,
        }));
      }

      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent via SMTP (cPanel)');
      return true;
    } catch (error) {
      console.warn('⚠️ SMTP email sending failed, trying Gmail OAuth2 fallback:', error instanceof Error ? error.message : 'Unknown error');
      // Continue to Gmail OAuth2 fallback
    }
  }

  // Fallback to Gmail OAuth2 if SMTP not configured or failed
  const hasGmailConfig = !!(
    process.env.GMAIL_API_CLIENT_ID && 
    process.env.GMAIL_API_CLIENT_SECRET && 
    process.env.GMAIL_API_REFRESH_TOKEN
  );

  if (!hasGmailConfig) {
    console.warn('⚠️ Neither SMTP nor Gmail OAuth2 configured. Email sending skipped.');
    return false; // Return false but don't throw error
  }

  try {
    const { mailerService } = await import('@/lib/gmail-oauth2-mailer');
    return await mailerService.sendEmail({
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo,
      attachments: payload.attachments
    } as any);
  } catch (error) {
    // Log error but don't break the application
    console.warn('⚠️ Email sending failed (non-critical):', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}


