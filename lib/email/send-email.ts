import nodemailer from 'nodemailer';

export type EmailPayload = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string; path?: string }>
};

let cachedTransport: nodemailer.Transporter | null = null;

function getSmtpTransport(): nodemailer.Transporter | null {
  try {
    if (cachedTransport) return cachedTransport;
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) return null;
    const secure = port === 465; // SSL for 465, STARTTLS for 587
    cachedTransport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });
    return cachedTransport;
  } catch {
    return null;
  }
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  // Prefer SMTP if configured; otherwise fall back to Gmail OAuth2 mailerService
  const transporter = getSmtpTransport();
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@naukrimili.com';
  const fromName = process.env.SMTP_FROM_NAME || 'NaukriMili';
  try {
    if (transporter) {
      await transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to: Array.isArray(payload.to) ? payload.to.join(',') : payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        replyTo: payload.replyTo,
        attachments: payload.attachments as any
      });
      return true;
    }
  } catch (err) {
    // fall through to Gmail OAuth2
    console.warn('SMTP send failed, falling back to Gmail OAuth2 mailerService');
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
  } catch {
    return false;
  }
}


