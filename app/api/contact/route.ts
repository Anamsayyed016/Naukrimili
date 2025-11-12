import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/send-email';

// Rate limiting map to prevent spam
const contactRequests = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of contactRequests.entries()) {
    if (now > value.resetTime) {
      contactRequests.delete(key);
    }
  }
}, 3600000); // 1 hour

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ContactFormData = await request.json();
    
    // Validation
    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    // Rate limiting: 5 messages per hour per IP
    const now = Date.now();
    const rateLimit = contactRequests.get(clientIp);
    
    if (rateLimit) {
      if (now < rateLimit.resetTime) {
        if (rateLimit.count >= 5) {
          return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
          );
        }
        rateLimit.count++;
      } else {
        // Reset counter after time window
        contactRequests.set(clientIp, { count: 1, resetTime: now + 3600000 });
      }
    } else {
      contactRequests.set(clientIp, { count: 1, resetTime: now + 3600000 });
    }

    // Get user agent and IP for logging
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ipAddress = clientIp;

    // Save to database
    let savedMessage;
    try {
      savedMessage = await prisma.contactMessage.create({
        data: {
          name: body.name.trim(),
          email: body.email.trim().toLowerCase(),
          phone: body.phone?.trim() || null,
          subject: body.subject.trim(),
          message: body.message.trim(),
          status: 'new',
          ipAddress,
          userAgent
        }
      });
      console.log('✅ Contact message saved to database:', savedMessage.id);
    } catch (dbError) {
      console.error('❌ Database save error:', dbError);
      // Continue anyway - email is more important than database
    }

    // Send email notification to HR
    const hrEmailSent = await sendEmail({
      to: 'hr@naukrimili.com',
      subject: `🔔 New Contact Form: ${body.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px 20px; }
            .field { margin-bottom: 25px; background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; }
            .label { font-weight: 600; color: #667eea; margin-bottom: 5px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
            .value { color: #2d3748; font-size: 16px; word-wrap: break-word; }
            .message-box { background: #fff; border: 2px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 10px; white-space: pre-wrap; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #718096; font-size: 14px; border-top: 1px solid #e2e8f0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
            .meta { color: #718096; font-size: 13px; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 New Contact Form Submission</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">NaukriMili.com</p>
            </div>
            
            <div class="content">
              <div class="field">
                <div class="label">👤 Name</div>
                <div class="value">${body.name}</div>
              </div>
              
              <div class="field">
                <div class="label">📧 Email</div>
                <div class="value">
                  <a href="mailto:${body.email}" style="color: #667eea; text-decoration: none;">${body.email}</a>
                </div>
              </div>
              
              ${body.phone ? `
              <div class="field">
                <div class="label">📱 Phone</div>
                <div class="value">
                  <a href="tel:${body.phone}" style="color: #667eea; text-decoration: none;">${body.phone}</a>
                </div>
              </div>
              ` : ''}
              
              <div class="field">
                <div class="label">📝 Subject</div>
                <div class="value">${body.subject}</div>
              </div>
              
              <div class="field">
                <div class="label">💬 Message</div>
                <div class="message-box">${body.message.replace(/\n/g, '<br>')}</div>
              </div>
              
              <div class="field">
                <div class="label">🕐 Received At</div>
                <div class="value">${new Date().toLocaleString('en-IN', { 
                  dateStyle: 'full', 
                  timeStyle: 'long',
                  timeZone: 'Asia/Kolkata'
                })}</div>
                <div class="meta">IP: ${ipAddress}</div>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="mailto:${body.email}" class="button">Reply to ${body.name}</a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Quick Actions:</strong></p>
              <p style="margin: 10px 0;">
                Reply directly to <a href="mailto:${body.email}" style="color: #667eea;">${body.email}</a>
                ${body.phone ? `or call <a href="tel:${body.phone}" style="color: #667eea;">${body.phone}</a>` : ''}
              </p>
              <p style="margin-top: 20px;">© ${new Date().getFullYear()} NaukriMili.com - All Rights Reserved</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
New Contact Form Submission - NaukriMili.com

Name: ${body.name}
Email: ${body.email}
${body.phone ? `Phone: ${body.phone}\n` : ''}
Subject: ${body.subject}

Message:
${body.message}

Received: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
IP Address: ${ipAddress}

Reply to: ${body.email}
      `.trim(),
      replyTo: body.email
    });

    // Send confirmation email to user
    const userEmailSent = await sendEmail({
      to: body.email,
      subject: 'Thank you for contacting NaukriMili',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .message-box { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3); }
            .footer { background: #f8f9fa; padding: 30px 20px; text-align: center; color: #718096; font-size: 14px; border-top: 1px solid #e2e8f0; }
            .contact-info { margin: 20px 0; padding: 15px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; }
            ul { padding-left: 20px; }
            ul li { margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Message Received!</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Thank you for reaching out to us</p>
            </div>
            
            <div class="content">
              <p style="font-size: 18px;">Hi <strong>${body.name}</strong>,</p>
              
              <p style="font-size: 16px;">We have successfully received your message and our team will review it shortly.</p>
              
              <div class="message-box">
                <p style="margin: 0 0 10px 0; color: #667eea; font-weight: 600;">Your Message:</p>
                <p style="margin: 0; white-space: pre-wrap;">${body.message}</p>
              </div>
              
              <p style="font-size: 16px;"><strong>What happens next?</strong></p>
              <ul style="font-size: 15px;">
                <li>Our team typically responds within <strong>24-48 hours</strong> during business days</li>
                <li>You'll receive a response at <strong>${body.email}</strong></li>
                <li>For urgent queries, call us at <strong>+91 73891 70003</strong></li>
              </ul>
              
              <p style="font-size: 16px;">In the meantime, you can:</p>
              <ul style="font-size: 15px;">
                <li>Browse our <a href="https://naukrimili.com/jobs" style="color: #667eea;">latest job openings</a></li>
                <li>Create your <a href="https://naukrimili.com/auth/register" style="color: #667eea;">job seeker profile</a></li>
                <li>Learn more <a href="https://naukrimili.com/about" style="color: #667eea;">about us</a></li>
              </ul>
              
              <div style="text-align: center;">
                <a href="https://naukrimili.com/jobs" class="button">Browse Latest Jobs</a>
              </div>
              
              <div class="contact-info">
                <p style="margin: 0 0 10px 0; font-weight: 600; color: #2d3748;">Contact Information:</p>
                <p style="margin: 5px 0;">📧 Email: <a href="mailto:hr@naukrimili.com" style="color: #667eea;">hr@naukrimili.com</a></p>
                <p style="margin: 5px 0;">📱 Phone: <a href="tel:+917389170003" style="color: #667eea;">+91 73891 70003</a></p>
                <p style="margin: 5px 0;">🌐 Website: <a href="https://naukrimili.com" style="color: #667eea;">www.naukrimili.com</a></p>
              </div>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>NaukriMili - India's Trusted Job Portal</strong></p>
              <p style="margin: 5px 0; font-size: 13px;">
                Main Office: City Walk Mall, 1st Floor, Near Lalghati<br>
                Bhopal, Madhya Pradesh 462030
              </p>
              <p style="margin: 20px 0 0 0;">© ${new Date().getFullYear()} NaukriMili.com - All Rights Reserved</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Thank You for Contacting NaukriMili!

Hi ${body.name},

We have successfully received your message and our team will review it shortly.

Your Message:
${body.message}

What happens next?
• Our team typically responds within 24-48 hours during business days
• You'll receive a response at ${body.email}
• For urgent queries, call us at +91 73891 70003

In the meantime, you can:
• Browse our latest job openings: https://naukrimili.com/jobs
• Create your job seeker profile: https://naukrimili.com/auth/register
• Learn more about us: https://naukrimili.com/about

Contact Information:
📧 Email: hr@naukrimili.com
📱 Phone: +91 73891 70003
🌐 Website: www.naukrimili.com

Best regards,
NaukriMili Team

Main Office: City Walk Mall, 1st Floor, Near Lalghati
Bhopal, Madhya Pradesh 462030

© ${new Date().getFullYear()} NaukriMili.com - All Rights Reserved
      `.trim()
    });

    // Log results
    console.log('📧 Contact form submission processed:', {
      id: savedMessage?.id || 'not-saved',
      name: body.name,
      email: body.email,
      subject: body.subject,
      hrEmail: hrEmailSent ? '✅' : '❌',
      userEmail: userEmailSent ? '✅' : '❌',
      timestamp: new Date().toISOString()
    });

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Message sent successfully! We\'ll get back to you soon.',
      id: savedMessage?.id
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Contact form API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send message. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    );
  }
}

