#!/usr/bin/env node
/**
 * STATIC CONTENT SEEDER
 * Seeds Privacy Policy and Terms of Service into StaticContent table
 * Run with: node scripts/seed-static-content.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRIVACY_POLICY_CONTENT = `Privacy Policy

Last Updated: 12/02/2025

Welcome to NaukriMili.com ("we," "our," "us").
We are committed to protecting your personal information and respecting your privacy. This Privacy Policy explains how we collect, use, store, and safeguard your information when you use our website, mobile site, and resume builder services.

By accessing or using NaukriMili.com, you agree to the practices described in this Privacy Policy.

1. Information We Collect

We collect information to provide a safe and efficient platform for job seekers and employers.

A. Information from Job Seekers

Full name

Email address

Phone number

Resume/CV

Job preferences

Profile details

Location (city/state)

Any additional information you choose to share

B. Information from Employers

Company/organization name

Contact person name

Business email

Phone number (optional)

Job posting details

Company profile details

C. Automatically Collected Information

When you use our platform, we may automatically collect:

IP address

Browser type & version

Device information

Operating system

Usage data (pages visited, time spent, clicks, interactions)

Cookies and similar tracking technologies

This information helps us improve performance, security, and user experience.

2. How We Use Your Information

We use your information to:

Create and manage your account

Match job seekers with relevant job opportunities

Allow employers to post, manage, and view candidate profiles

Provide resume builder services

Improve website performance and user experience

Communicate updates, alerts, verification messages, or promotional offers

Prevent fraud, maintain security, and ensure platform integrity

We do not sell your personal information to any third party.

3. Sharing of Information

Your information is shared only when required:

With Employers

Job seekers' profiles and resumes are shared with employers for hiring purposes.

With Job Seekers

Employer name, company details, and job information are visible on job postings.

With Service Providers

Trusted vendors who support:

Hosting

Payment gateway (e.g., Razorpay)

Analytics

Email delivery

Security systems

These third parties are required to keep your data safe.

4. Data Security

We take reasonable security measures to protect your personal information, including:

Encrypted connections (HTTPS)

Secure data storage

Limited access to personal information

However, no online system is completely secure. We advise users to stay cautious while sharing personal details online.

5. Cookies

NaukriMili.com uses cookies to:

Improve website functionality

Save user preferences

Analyze site usage

Enhance resume builder performance

You can disable cookies through your browser settings, but some features may not work properly.

6. Your Rights

You have the right to:

Access and update your information

Delete your account

Request that we stop sending marketing emails

Request clarification about data usage

To exercise these rights, contact us at support@naukrimili.com

7. Third-Party Links

Our website may contain links to third-party sites.
We are not responsible for their privacy policies, content, or practices.

8. Updates to This Policy

We may update this Privacy Policy periodically. Updated versions will be posted with a new "Last Updated" date. Continued use of the platform means you accept the updated policy.

9.Refund Policy (Resume Builder Service)


Our resume builder tool allows users to create their resume independently, step-by-step, through an automated online process. Once the resume is completed, users are directed to the payment gateway, and after successful payment, the resume becomes available for immediate download.

Because this is a digital, self-created, service-based product, the following refund rules apply:

1. Refund & Cancellation Policy

Once payment is completed and the resume is successfully generated or downloaded, no refund will be issued.
This is because:

It is a non-returnable digital service

The resume is created by the customer themselves using our automated system

No physical product is involved

2. Refund Eligibility (Only in Limited Cases)

A refund may be provided only in the following rare situations:

✔ Duplicate payment

If the same customer is charged twice for one resume.

✔ Technical failure

If payment is deducted but the resume is not generated or available for download.

In such cases, users must send proof of payment and details to:
📧 support@naukrimili.com

Refunds (if approved) will be processed to the original payment method within 7–10 working days.

3. Non-Refundable Situations

Refunds will NOT be given for:

"I don't like the design/template"

"I chose the wrong format"

"I didn't need the resume anymore"

"I made a mistake in my details"

"I expected manual resume writing service"

"I downloaded it once and lost the file"

"I changed my mind after purchase"

4. User Responsibility

As the resume is created entirely by the user:

You are responsible for entering correct details

You can edit before downloading

Our system only formats the resume — we do not write or modify content

5. Contact for Refund/Support

For any refund-related query or technical issue:
📧 support@naukrimili.com

10. Contact Us

If you have any questions or concerns regarding this Privacy Policy, you can reach us at:

📧 Email: support@naukrimili.com

🌐 Website: www.naukrimili.com`;

async function seedStaticContent() {
  try {
    console.log('🌱 Starting Static Content seeding...\n');

    // Check for existing privacy policy
    const existingPrivacy = await prisma.staticContent.findUnique({
      where: { key: 'privacy' }
    });

    if (existingPrivacy) {
      console.log('📝 Existing Privacy Policy found. Updating...');
      await prisma.staticContent.update({
        where: { key: 'privacy' },
        data: {
          title: 'Privacy Policy',
          content: PRIVACY_POLICY_CONTENT,
          isActive: true,
          updatedAt: new Date()
        }
      });
      console.log('✅ Privacy Policy updated successfully!\n');
    } else {
      console.log('📝 Creating new Privacy Policy...');
      await prisma.staticContent.create({
        data: {
          key: 'privacy',
          title: 'Privacy Policy',
          content: PRIVACY_POLICY_CONTENT,
          isActive: true
        }
      });
      console.log('✅ Privacy Policy created successfully!\n');
    }

    // Verify the content was saved
    const savedPrivacy = await prisma.staticContent.findUnique({
      where: { key: 'privacy' }
    });

    if (savedPrivacy) {
      console.log('✅ Verification: Privacy Policy exists in database');
      console.log(`   ID: ${savedPrivacy.id}`);
      console.log(`   Title: ${savedPrivacy.title}`);
      console.log(`   Content Length: ${savedPrivacy.content.length} characters`);
      console.log(`   Active: ${savedPrivacy.isActive}`);
      console.log(`   Last Updated: ${savedPrivacy.updatedAt.toISOString()}\n`);
    }

    console.log('🎉 Static Content seeding completed successfully!');
    console.log('\n📌 Next steps:');
    console.log('   1. Privacy Policy is now available at: /api/content/privacy');
    console.log('   2. The frontend page will fetch from this API');
    console.log('   3. Test the page at: /privacy\n');

  } catch (error) {
    console.error('❌ Error seeding static content:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedStaticContent()
  .then(() => {
    console.log('✅ Seeding process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding process failed:', error);
    process.exit(1);
  });

