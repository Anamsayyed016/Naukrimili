'use client';

/**
 * Resume Builder Editor Page - Temporarily Disabled
 * 
 * This page has been disabled to resolve TDZ (Temporal Dead Zone) initialization errors.
 * The editor form will be rebuilt with proper module loading patterns.
 * 
 * For now, this page redirects users back to template selection.
 */

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ResumeEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');
  const typeId = searchParams.get('type') || 'experienced';

  // Auto-redirect to templates page after a brief moment
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(`/resume-builder/templates?type=${typeId}`);
    }, 2000);

    return () => clearTimeout(timer);
  }, [router, typeId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.push(`/resume-builder/templates?type=${typeId}`)}
            className="mb-6 hover:bg-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 lg:p-12 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <Wrench className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Editor Temporarily Unavailable
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                The resume editor is being rebuilt to fix technical issues.
              </p>
              <p className="text-sm text-gray-500">
                You'll be redirected to template selection in a moment...
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => router.push(`/resume-builder/templates?type=${typeId}`)}
                  className="flex items-center justify-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Browse Templates
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/resume-builder/start')}
                >
                  Go to Start Page
                </Button>
              </div>
            </div>

            {templateId && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Selected template: <span className="font-mono">{templateId}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
