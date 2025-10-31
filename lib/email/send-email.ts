export type EmailPayload = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string; path?: string }>
};

/**
 * Send email using Gmail OAuth2 API only (SMTP removed)
 * This function uses the Gmail API which was working fine
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
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
    console.error('❌ Failed to send email via Gmail OAuth2:', error);
    return false;
  }
}


