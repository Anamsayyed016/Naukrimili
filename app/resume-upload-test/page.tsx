'use client';

import React from 'react';
import ResumeUpload from '@/components/resume/ResumeUpload';

export default function ResumeUploadTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Resume Upload Test
          </h1>
          <p className="text-gray-600">
            Test the complete resume upload flow with AI extraction and profile completion
          </p>
        </div>
        
        <ResumeUpload 
          userId="test-user-123"
          onComplete={() => {
            alert('Profile completed successfully!');
          }}
        />
      </div>
    </div>
  );
}
