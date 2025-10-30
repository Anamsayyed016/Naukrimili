/**
 * Test Email API Endpoint
 * 
 * This endpoint allows testing the email functionality without affecting
 * the existing Socket.io notification system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { mailerService } from '@/lib/gmail-oauth2-mailer';
import { sendEmail } from '@/lib/email/send-email';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { emailType, recipientEmail, testData } = body;

    // Check SMTP configuration
    const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    
    // Validate email service status (for Gmail OAuth2 fallback)
    const emailStatus = mailerService.getStatus();

    let emailSent = false;
    let emailDetails = {};

    // Test different email types
    switch (emailType) {
      case 'welcome':
        emailSent = await mailerService.sendWelcomeEmail(
          recipientEmail || session.user.email || 'test@example.com',
          testData?.name || 'Test User',
          testData?.provider || 'google'
        );
        emailDetails = {
          type: 'Welcome Email',
          recipient: recipientEmail || session.user.email,
          subject: 'Welcome to Aftionix Job Portal! 🎉'
        };
        break;

      case 'application_notification':
        emailSent = await mailerService.sendApplicationNotificationEmail(
          recipientEmail || session.user.email || 'test@example.com',
          testData?.employerName || 'Test Employer',
          testData?.jobTitle || 'Software Engineer',
          testData?.applicantName || 'Test Applicant'
        );
        emailDetails = {
          type: 'Application Notification',
          recipient: recipientEmail || session.user.email,
          subject: `New Application for ${testData?.jobTitle || 'Software Engineer'}`
        };
        break;

      case 'application_status':
        emailSent = await mailerService.sendApplicationStatusEmail(
          recipientEmail || session.user.email || 'test@example.com',
          testData?.applicantName || 'Test Applicant',
          testData?.jobTitle || 'Software Engineer',
          testData?.status || 'Under Review',
          testData?.companyName || 'Test Company'
        );
        emailDetails = {
          type: 'Application Status Update',
          recipient: recipientEmail || session.user.email,
          subject: `Application Status Update: ${testData?.jobTitle || 'Software Engineer'}`
        };
        break;

      case 'smtp_test':
        // Test SMTP using the new sendEmail helper
        emailSent = await sendEmail({
          to: recipientEmail || session.user.email || 'test@example.com',
          subject: testData?.subject || 'SMTP Test Email from NaukriMili',
          html: testData?.html || `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #2563eb;">✅ SMTP Email Test Successful!</h2>
              <p>This email confirms that your SMTP configuration is working correctly.</p>
              <p><strong>Test Details:</strong></p>
              <ul>
                <li><strong>Sent at:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Method:</strong> SMTP (${process.env.SMTP_HOST || 'N/A'})</li>
                <li><strong>From:</strong> ${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'N/A'}</li>
              </ul>
              <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666;">
                If you received this email, your production email system is fully operational! 🎉
              </p>
            </div>
          `,
          text: testData?.text || `SMTP Test Email from NaukriMili\n\nSent at: ${new Date().toLocaleString()}\n\nIf you received this email, your SMTP configuration is working correctly!`
        });
        emailDetails = {
          type: 'SMTP Test Email',
          recipient: recipientEmail || session.user.email,
          subject: testData?.subject || 'SMTP Test Email from NaukriMili',
          method: smtpConfigured ? 'SMTP' : 'Gmail OAuth2 (fallback)'
        };
        break;

      case 'custom':
        // Use new sendEmail helper (supports SMTP and Gmail OAuth2 fallback)
        emailSent = await sendEmail({
          to: recipientEmail || session.user.email || 'test@example.com',
          subject: testData?.subject || 'Test Email from NaukriMili',
          text: testData?.text || 'This is a test email to verify email functionality.',
          html: testData?.html || `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Test Email</h2>
              <p>This is a test email to verify email functionality.</p>
              <p>If you receive this email, your email integration is working correctly!</p>
              <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
            </div>
          `
        });
        emailDetails = {
          type: 'Custom Test Email',
          recipient: recipientEmail || session.user.email,
          subject: testData?.subject || 'Test Email from NaukriMili',
          method: smtpConfigured ? 'SMTP' : 'Gmail OAuth2 (fallback)'
        };
        break;

      case 'gmail_api_test':
        const testResult = await mailerService.testEmailDelivery();
        emailSent = testResult.success;
        emailDetails = {
          type: 'Gmail API Endpoint Test',
          recipient: process.env.GMAIL_SENDER?.match(/<(.*?)>/)?.[1] || 'naukrimili@naukrimili.com',
          subject: 'Gmail OAuth2 Test Email',
          details: testResult
        };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid email type. Supported types: welcome, application_notification, application_status, custom, smtp_test, gmail_api_test',
          supportedTypes: ['welcome', 'application_notification', 'application_status', 'custom', 'smtp_test', 'gmail_api_test']
        }, { status: 400 });
    }

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        emailDetails,
        timestamp: new Date().toISOString(),
        emailServiceStatus: emailStatus,
        smtpConfigured,
        configuration: {
          smtpHost: process.env.SMTP_HOST || 'Not set',
          smtpPort: process.env.SMTP_PORT || 'Not set',
          smtpUser: process.env.SMTP_USER ? `${process.env.SMTP_USER.split('@')[0]}@***` : 'Not set',
          smtpFromEmail: process.env.SMTP_FROM_EMAIL || 'Not set',
          smtpFromName: process.env.SMTP_FROM_NAME || 'Not set'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send test email',
        emailDetails,
        emailServiceStatus: emailStatus,
        smtpConfigured,
        configuration: {
          smtpHost: process.env.SMTP_HOST || 'Not set',
          smtpPort: process.env.SMTP_PORT || 'Not set',
          smtpUser: process.env.SMTP_USER ? `${process.env.SMTP_USER.split('@')[0]}@***` : 'Not set'
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Test email error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return email service status
    const emailStatus = mailerService.getStatus();
    
    return NextResponse.json({
      emailService: emailStatus,
      timestamp: new Date().toISOString(),
      environment: {
        smtpHost: process.env.SMTP_HOST || 'Not set',
        smtpPort: process.env.SMTP_PORT || 'Not set',
        smtpUser: process.env.SMTP_USER ? '***@gmail.com' : 'Not set',
        smtpFromEmail: process.env.SMTP_FROM_EMAIL || 'Not set',
        smtpFromName: process.env.SMTP_FROM_NAME || 'Not set'
      },
      usage: {
        message: 'Use POST /api/test-email with emailType and optional testData to send test emails',
        supportedTypes: ['welcome', 'application_notification', 'application_status', 'custom', 'smtp_test', 'gmail_api_test'],
        examples: {
          smtp_test: {
            emailType: 'smtp_test',
            recipientEmail: 'your-email@example.com'
          },
          custom: {
            emailType: 'custom',
            recipientEmail: 'test@example.com',
            testData: {
              subject: 'Test Email',
              text: 'Test message',
              html: '<p>Test HTML</p>'
            }
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Email status check error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
