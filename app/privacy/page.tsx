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
        const response = await fetch('/api/content/privacy');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setContent(result.data);
        } else {
          throw new Error('Invalid response format');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching privacy policy:', error);
        setError('Failed to load privacy policy. Please try again later.');
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
