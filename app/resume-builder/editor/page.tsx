'use client';

/**
 * Resume Builder Editor Page - COMPLETELY DISABLED
 * 
 * This page has been completely disabled to resolve persistent TDZ (Temporal Dead Zone) initialization errors.
 * The editor route is disabled at the route level to prevent any eager module evaluation.
 * 
 * Users will be redirected to template selection.
 */

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Wrench } from 'lucide-react';

export default function ResumeEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeId = searchParams.get('type') || 'experienced';

  // Immediate redirect - no component loading, no dynamic imports
  useEffect(() => {
    router.replace(`/resume-builder/templates?type=${typeId}`);
  }, [router, typeId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 lg:p-12">
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
                Redirecting you to template selection...
              </p>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <Button
                onClick={() => router.push(`/resume-builder/templates?type=${typeId}`)}
                className="flex items-center justify-center mx-auto"
              >
                <FileText className="w-4 h-4 mr-2" />
                Browse Templates
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
