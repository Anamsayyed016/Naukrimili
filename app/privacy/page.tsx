"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Calendar, Clock, Eye, Lock } from "lucide-react";

interface StaticContent {
  id: string;
  key: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PrivacyPage() {
  const [content, setContent] = useState<StaticContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        // In a real implementation, this would fetch from /api/static-content/privacy
        const mockPrivacy: StaticContent = {
          id: "privacy-1",
          key: "privacy",
          title: "Privacy Policy",
          content: `
# Privacy Policy

**Last updated: ${new Date().toLocaleDateString()}**

## Introduction

At JobPortal, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our job portal service.

## Information We Collect

### Personal Information

We collect personal information that you provide directly to us, including:

- **Account Information:** Name, email address, phone number, password
- **Profile Information:** Work experience, education, skills, career preferences
- **Resume Information:** Professional history, qualifications, achievements
- **Communication Data:** Messages sent through our platform
- **Application Data:** Job applications and related information

### Automatically Collected Information

We automatically collect certain information when you use our service:

- **Usage Data:** Pages visited, time spent, clicks, interactions
- **Device Information:** IP address, browser type, operating system
- **Location Data:** General geographic location (city/region level)
- **Cookies and Tracking:** See our Cookie Policy for details

## How We Use Your Information

We use your information to:

### Service Provision
- Create and manage your account
- Match you with relevant job opportunities
- Enable communication between job seekers and employers
- Process job applications
- Provide customer support

### Service Improvement
- Analyze usage patterns to improve our platform
- Develop new features and services
- Conduct research and analytics
- Prevent fraud and ensure security

### Communication
- Send service-related notifications
- Share job recommendations and alerts
- Provide customer support responses
- Send marketing communications (with your consent)

## Information Sharing and Disclosure

### With Employers

When you apply for a job, we share your application information with the relevant employer, including:
- Your resume and profile information
- Contact details you choose to share
- Application responses and cover letters

### Service Providers

We share information with third-party service providers who help us operate our service:
- Cloud hosting providers
- Email service providers
- Analytics services
- Payment processors (if applicable)

### Legal Requirements

We may disclose your information when required by law or to:
- Comply with legal process
- Protect our rights and property
- Investigate potential violations
- Protect user safety

### Business Transfers

In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.

## Data Security

We implement appropriate security measures to protect your information:

### Technical Safeguards
- Encryption of data in transit and at rest
- Secure server infrastructure
- Regular security audits and monitoring
- Access controls and authentication

### Administrative Safeguards
- Employee training on data protection
- Limited access to personal information
- Regular security policy updates
- Incident response procedures

### Physical Safeguards
- Secure data center facilities
- Controlled access to servers
- Environmental monitoring
- Backup and recovery systems

## Your Rights and Choices

### Account Management
- **Access:** View and download your personal information
- **Update:** Modify your profile and account settings
- **Delete:** Request deletion of your account and data
- **Portability:** Export your data in common formats

### Communication Preferences
- **Email Settings:** Control which emails you receive
- **Notification Settings:** Manage push and in-app notifications
- **Marketing Opt-out:** Unsubscribe from marketing communications

### Privacy Controls
- **Profile Visibility:** Control who can see your profile
- **Application Privacy:** Manage application visibility
- **Contact Preferences:** Set how employers can contact you

## Cookies and Tracking Technologies

We use cookies and similar technologies to:

### Essential Cookies
- Maintain your login session
- Remember your preferences
- Ensure website security
- Enable core functionality

### Analytics Cookies
- Understand how you use our service
- Improve user experience
- Measure website performance
- Track conversion rates

### Marketing Cookies
- Show relevant advertisements
- Measure ad effectiveness
- Personalize content
- Track social media interactions

You can control cookies through your browser settings, but some features may not work properly if you disable them.

## Data Retention

We retain your information for as long as necessary to:
- Provide our services to you
- Comply with legal obligations
- Resolve disputes
- Enforce our agreements

### Retention Periods
- **Active Accounts:** While your account is active
- **Inactive Accounts:** Up to 3 years after last activity
- **Application Data:** As required by employers and legal requirements
- **Marketing Data:** Until you opt out or as legally required

## International Data Transfers

If you are located outside our primary jurisdiction, your information may be transferred to and processed in countries with different privacy laws. We ensure appropriate safeguards are in place for such transfers.

## Children's Privacy

Our service is not intended for children under 16. We do not knowingly collect personal information from children under 16. If we become aware that we have collected such information, we will delete it promptly.

## Changes to This Privacy Policy

We may update this Privacy Policy periodically. We will notify you of material changes by:
- Posting the updated policy on our website
- Sending email notifications to registered users
- Providing in-app notifications
- Giving 30 days notice for material changes

## Contact Information

If you have questions about this Privacy Policy or our privacy practices, please contact us:

### Privacy Officer
- **Email:** privacy@jobportal.com
- **Address:** [Company Address]
- **Phone:** [Company Phone]

### Data Protection Requests
For requests related to your personal data (access, deletion, etc.), please use our dedicated portal or contact our privacy team directly.

### Complaints
If you believe we have not complied with this Privacy Policy or applicable privacy laws, you may file a complaint with us or the relevant data protection authority.

## Additional Information

### Cookie Policy
For detailed information about our use of cookies, please see our separate Cookie Policy.

### Terms of Service
This Privacy Policy should be read in conjunction with our Terms of Service.

### Security Incidents
If you believe your account has been compromised, please contact us immediately.

---

By using our service, you acknowledge that you have read and understood this Privacy Policy and agree to the collection and use of your information as described herein.
          `,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Simulate API delay
        setTimeout(() => {
          setContent(mockPrivacy);
          setLoading(false);
        }, 500);
      } catch (_error) {
        setError('Failed to load privacy policy');
        setLoading(false);
      }
    };

    fetchPrivacy();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Privacy Policy</h3>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Privacy Policy Not Available</h3>
            <p className="text-gray-600">Privacy policy content is not currently available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatMarkdown = (text: string) => {
    // Simple markdown-like formatting
    return text
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold text-gray-900 mb-6">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold text-gray-900 mb-4 mt-8">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold text-gray-900 mb-3 mt-6">$1</h3>')
      .replace(/^\*\*(.+)\*\*$/gm, '<p class="font-semibold text-gray-900 mb-2">$1</p>')
      .replace(/^\- (.+)$/gm, '<li class="text-gray-700 mb-1">$1</li>')
      .replace(/^([^<\-#\*\n].+)$/gm, '<p class="text-gray-700 mb-4 leading-relaxed">$1</p>')
      .replace(/(<li.*<\/li>)/g, '<ul class="list-disc pl-6 mb-4 space-y-1">$1</ul>')
      .replace(/\n\n/g, '\n')
      .replace(/\n/g, '');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                  {content.title}
                </CardTitle>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Created: {new Date(content.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Updated: {new Date(content.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <Shield className="h-12 w-12 text-green-500" />
            </div>
          </CardHeader>
        </Card>

        {/* Privacy Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <Eye className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-blue-900 mb-2">Transparency</h3>
              <p className="text-blue-700 text-sm">We're clear about what data we collect and how we use it</p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
              <Lock className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-green-900 mb-2">Security</h3>
              <p className="text-green-700 text-sm">Your data is protected with industry-standard security measures</p>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-purple-900 mb-2">Control</h3>
              <p className="text-purple-700 text-sm">You have control over your personal information and privacy settings</p>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <Card>
          <CardContent className="p-8">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: formatMarkdown(content.content.trim()) 
              }}
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <Card className="mt-8 bg-green-50 border-green-200">
          <CardContent className="p-6 text-center">
            <h4 className="font-semibold text-green-900 mb-2">Questions about Privacy?</h4>
            <p className="text-green-700 mb-4">
              We're committed to protecting your privacy. If you have any questions or concerns, please reach out to us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:privacy@jobportal.com" 
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Contact Privacy Team
              </a>
              <a 
                href="/terms" 
                className="bg-white text-green-600 border border-green-600 px-6 py-2 rounded-lg hover:bg-green-50 transition-colors"
              >
                View Terms of Service
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
