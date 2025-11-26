'use client';

/**
 * Resume Builder Editor Page
 * 
 * TEMPORARILY DISABLED - Editor form removed for diagnostic purposes
 * This page will show a message instead of the full editor to help diagnose TDZ issues.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function ResumeEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');
  const typeId = searchParams.get('type');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Editor Temporarily Disabled
            </h1>
            <p className="text-gray-600 mb-4">
              The resume builder editor form has been temporarily removed for diagnostic purposes.
            </p>
            {templateId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm text-gray-600">
                  <strong>Template ID:</strong> {templateId}
                </p>
                {typeId && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Resume Type:</strong> {typeId}
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={() => router.push(`/resume-builder/templates${typeId ? `?type=${typeId}` : ''}`)}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Template Selection
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/resume-builder/start')}
              className="w-full"
            >
              Back to Start
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
