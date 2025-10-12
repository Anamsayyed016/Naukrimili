/**
 * Test Email API Endpoint
 * 
 * This endpoint allows testing the email functionality without affecting
 * the existing Socket.io notification system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { mailerService } from '@/lib/mailer';

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

    // Validate email service status
    const emailStatus = mailerService.getStatus();
    
    if (!emailStatus.configured) {
      return NextResponse.json({
        success: false,
        error: 'Email service not configured. Please check SMTP_USER and SMTP_PASS environment variables.',
        status: emailStatus
      }, { status: 400 });
    }

    if (!emailStatus.ready) {
      return NextResponse.json({
        success: false,
        error: 'Email service not ready. Please check SMTP configuration.',
        status: emailStatus
      }, { status: 503 });
    }

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

      case 'custom':
        emailSent = await mailerService.sendEmail({
          to: recipientEmail || session.user.email || 'test@example.com',
          subject: testData?.subject || 'Test Email from Aftionix',
          text: testData?.text || 'This is a test email to verify SMTP functionality.',
          html: testData?.html || `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Test Email</h2>
              <p>This is a test email to verify SMTP functionality.</p>
              <p>If you receive this email, your Gmail SMTP integration is working correctly!</p>
              <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
            </div>
          `
        });
        emailDetails = {
          type: 'Custom Test Email',
          recipient: recipientEmail || session.user.email,
          subject: testData?.subject || 'Test Email from Aftionix'
        };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid email type. Supported types: welcome, application_notification, application_status, custom',
          supportedTypes: ['welcome', 'application_notification', 'application_status', 'custom']
        }, { status: 400 });
    }

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        emailDetails,
        timestamp: new Date().toISOString(),
        emailServiceStatus: emailStatus
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send test email',
        emailDetails,
        emailServiceStatus: emailStatus
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

export async function GET(request: NextRequest) {
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
        supportedTypes: ['welcome', 'application_notification', 'application_status', 'custom'],
        example: {
          emailType: 'custom',
          recipientEmail: 'test@example.com',
          testData: {
            subject: 'Test Email',
            text: 'Test message',
            html: '<p>Test HTML</p>'
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
