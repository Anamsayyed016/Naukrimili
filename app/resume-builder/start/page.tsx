'use client';

import ResumeBuilderStart from '@/components/resume-builder/ResumeBuilderStart';

export default function ResumeBuilderStartPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        {/* Hero Section */}
        <ResumeBuilderStart />

        {/* Trust Indicators Section */}
        <div className="mt-12 md:mt-16 lg:mt-20">
          <div className="text-center space-y-4">
            <p className="text-sm md:text-base text-gray-600">
              Trusted by thousands of job seekers worldwide
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-xs md:text-sm text-gray-500">
              <span>✓ Free to use</span>
              <span>✓ No credit card required</span>
              <span>✓ ATS compatible</span>
              <span>✓ Multiple formats</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

