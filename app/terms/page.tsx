"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, Clock } from "lucide-react";

interface StaticContent {
  id: string;
  key: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TermsPage() {
  const [content, setContent] = useState<StaticContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        // In a real implementation, this would fetch from /api/static-content/terms
        // For now, providing comprehensive terms content
        const mockTerms: StaticContent = {
          id: "terms-1",
          key: "terms",
          title: "Terms of Service",
          content: `
# Terms of Service

**Last updated: ${new Date().toLocaleDateString()}**

## 1. Acceptance of Terms

By accessing and using this job portal ("Service"), you accept and agree to be bound by the terms and provision of this agreement.

## 2. Use License

Permission is granted to temporarily download one copy of the materials on the job portal for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:

- Modify or copy the materials
- Use the materials for any commercial purpose or for any public display (commercial or non-commercial)
- Attempt to decompile or reverse engineer any software contained on the website
- Remove any copyright or other proprietary notations from the materials

## 3. User Accounts

When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for maintaining the confidentiality of your account.

### Account Responsibilities

- You are responsible for all activities that occur under your account
- You must immediately notify us of any unauthorized use of your account
- You may not use another person's account without permission
- You may not sell, transfer, or assign your account to another party

## 4. Job Postings and Applications

### For Employers

- All job postings must be legitimate employment opportunities
- Job descriptions must be accurate and not misleading
- You may not discriminate based on protected characteristics
- You are responsible for your own hiring decisions and processes

### For Job Seekers

- You must provide accurate information in your profile and applications
- You may not apply for positions you are not qualified for with intent to mislead
- Resume and profile information must be truthful and current
- You may not use the service to spam employers

## 5. Privacy and Data Protection

Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.

### Data Collection

- We collect information you provide directly to us
- We may collect information automatically when you use our service
- We use this information to provide and improve our service

### Data Sharing

- We do not sell your personal information
- We may share information with employers when you apply for jobs
- We may share aggregated, non-personal information

## 6. Prohibited Uses

You may not use our Service:

- For any unlawful purpose or to solicit others to perform illegal acts
- To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances
- To transmit, or procure the sending of, any advertising or promotional material without our prior written consent
- To impersonate or attempt to impersonate the company, a company employee, another user, or any other person or entity
- In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful
- To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the website

## 7. Content Guidelines

### User-Generated Content

- Users are responsible for the content they post
- Content must not be illegal, harmful, threatening, abusive, or defamatory
- We reserve the right to remove content that violates these terms
- We do not endorse any user-generated content

### Intellectual Property

- Users retain rights to their own content
- By posting content, you grant us a license to use it in connection with our service
- You may not post content that infringes on others' intellectual property rights

## 8. Service Availability

- We strive to maintain high availability but cannot guarantee uninterrupted service
- We may suspend or terminate service for maintenance or other reasons
- We are not liable for any downtime or service interruptions

## 9. Limitation of Liability

In no event shall the company or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the service, even if the company or a company authorized representative has been notified orally or in writing of the possibility of such damage.

## 10. Indemnification

You agree to indemnify, defend, and hold harmless the company and its affiliates from any claim or demand, including reasonable attorneys' fees, made by any third party due to or arising out of your use of the service, your violation of these terms, or your violation of any rights of another.

## 11. Termination

We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.

Upon termination:
- Your right to use the service will cease immediately
- We may delete your account and all associated data
- Any provisions that should survive termination will remain in effect

## 12. Changes to Terms

We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.

## 13. Governing Law

These Terms shall be interpreted and governed by the laws of the jurisdiction in which the company operates, without regard to its conflict of law provisions.

## 14. Severability

If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law.

## 15. Contact Information

If you have any questions about these Terms of Service, please contact us at:

- **Email:** legal@jobportal.com
- **Address:** [Company Address]
- **Phone:** [Company Phone]

---

By using our service, you acknowledge that you have read these terms of service and agree to be bound by them.
          `,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Simulate API delay
        setTimeout(() => {
          setContent(mockTerms);
          setLoading(false);
        }, 500);
      } catch (error) {
        setError('Failed to load terms of service');
        setLoading(false);
      }
    };

    fetchTerms();
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
            <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Terms</h3>
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
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Terms Not Available</h3>
            <p className="text-gray-600">Terms of service content is not currently available.</p>
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
              <FileText className="h-12 w-12 text-blue-500" />
            </div>
          </CardHeader>
        </Card>

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
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <h4 className="font-semibold text-blue-900 mb-2">Questions about our Terms?</h4>
            <p className="text-blue-700 mb-4">
              If you have any questions about these terms of service, please don't hesitate to contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:legal@jobportal.com" 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Legal Team
              </a>
              <a 
                href="/privacy" 
                className="bg-white text-blue-600 border border-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                View Privacy Policy
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
