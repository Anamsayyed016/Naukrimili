/**
 * Temporary Mailer Stub
 * 
 * This is a temporary placeholder while transitioning from SMTP to Gmail OAuth2.
 * All email methods are disabled and return false.
 * 
 * This file will be DELETED when lib/gmail-oauth2-mailer.ts is ready.
 * 
 * DO NOT USE THIS FILE - It's only here to prevent import errors during transition.
 */

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

class MailerServiceStub {
  private isInitialized = false;

  constructor() {
    console.warn('⚠️  SMTP mailer has been removed. Email functionality is temporarily disabled.');
    console.warn('⚠️  Waiting for Gmail OAuth2 implementation to be completed.');
  }

  async sendEmail(config: EmailConfig): Promise<boolean> {
    console.warn('⚠️  Email sending is disabled during SMTP to OAuth2 migration');
    return false;
  }

  async sendWelcomeEmail(to: string, name: string, provider: string): Promise<boolean> {
    console.warn('⚠️  Welcome email disabled during migration');
    console.log(`[STUB] Would send welcome email to: ${to}, name: ${name}, provider: ${provider}`);
    return false;
  }

  async sendApplicationNotification(to: string, jobTitle: string, companyName: string): Promise<boolean> {
    console.warn('⚠️  Application notification disabled during migration');
    console.log(`[STUB] Would send application notification to: ${to}, job: ${jobTitle}, company: ${companyName}`);
    return false;
  }

  async sendApplicationStatusUpdate(to: string, jobTitle: string, status: string): Promise<boolean> {
    console.warn('⚠️  Status update notification disabled during migration');
    console.log(`[STUB] Would send status update to: ${to}, job: ${jobTitle}, status: ${status}`);
    return false;
  }

  isReady(): boolean {
    return false;
  }

  getStatus() {
    return {
      ready: false,
      configured: false,
      message: 'SMTP removed, awaiting Gmail OAuth2 implementation'
    };
  }
}

export const mailerService = new MailerServiceStub();
export default mailerService;

