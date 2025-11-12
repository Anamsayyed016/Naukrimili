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

Welcome to **NaukriMili.com** ("we," "our," or "us").

Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website and services.

## 1. Information We Collect

We collect information to help job seekers and employers connect easily and safely.

The types of information we may collect include:

### From Job Seekers:

- Name, email address, phone number
- Resume/CV
- Job preferences
- Location
- Other details you choose to share in your profile

### From Employers:

- Company name
- Contact person
- Business email
- Job postings
- Other related details

### Automatically Collected Information:

We may collect information such as:
- Your IP address
- Browser type
- Device details
- How you interact with our website (for analytics and performance improvement)

## 2. How We Use Your Information

We use your information to:

- Create and manage your account
- Match job seekers with suitable job opportunities
- Allow employers to post and manage job listings
- Improve our website and user experience
- Communicate updates, alerts, or offers related to our services
- Maintain the safety and integrity of our platform

## 3. Information Sharing

We share limited information only when necessary:

- **With employers**, so they can view job seekers' profiles and contact candidates
- **With job seekers**, so they can view employer details on job postings
- **With service providers** who help us operate our platform (like hosting, analytics, or email communication tools)

All such third parties are required to keep your information secure.

## 4. Data Security

We use reasonable security measures to protect your information from unauthorized access, misuse, or disclosure.

However, no online system is 100% secure, so we encourage users to be cautious when sharing personal details.

## 5. Cookies

**NaukriMili.com** uses cookies to enhance your browsing experience and understand how users interact with the site.

You can control or disable cookies through your browser settings.

## 6. Your Rights

You have the right to:

- **Access and update** your profile information
- **Delete** your account at any time
- **Request** that we stop sending you marketing emails

To exercise these rights, contact us at **support@naukrimili.com**

## 7. Links to Other Websites

Our website may contain links to other websites. We are not responsible for the privacy practices or content of those third-party sites.

## 8. Changes to This Policy

We may update this Privacy Policy from time to time. Any updates will be posted on this page with a new "Last Updated" date.

## 9. Contact Us

If you have any questions or concerns about this Privacy Policy, please contact us at:

**📧 Email:** support@naukrimili.com

**🌐 Website:** www.naukrimili.com

---

**By using NaukriMili.com, you acknowledge that you have read and understood this Privacy Policy.**
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
                href="mailto:support@naukrimili.com" 
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
