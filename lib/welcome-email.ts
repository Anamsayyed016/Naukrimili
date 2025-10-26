/**
 * Welcome Email Service for New OAuth Users
 * 
 * Now using Gmail OAuth2 for professional email delivery
 */

import { mailerService } from '@/lib/gmail-oauth2-mailer';

interface WelcomeEmailData {
  email: string;
  name: string;
  provider: 'google' | 'linkedin';
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  try {
    console.log('📧 Sending Welcome Email:', {
      to: data.email,
      name: data.name,
      provider: data.provider,
    });

    // Send actual welcome email using our mailer service
    const emailSent = await mailerService.sendWelcomeEmail(
      data.email,
      data.name || 'User',
      data.provider
    );

    if (emailSent) {
      console.log(`✅ Welcome email sent successfully to ${data.email} (${data.provider})`);
    } else {
      console.warn(`⚠️ Failed to send welcome email to ${data.email}`);
    }

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    // Don't throw error to avoid breaking the OAuth flow
  }
}

