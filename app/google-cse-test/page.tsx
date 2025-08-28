'use client';

import React from 'react';
import GoogleCSESearch from '@/components/GoogleCSESearch';
import GoogleCSETest from '@/components/GoogleCSETest';

export default function GoogleCSETestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Google CSE Integration Test
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Test your Google Custom Search Engine integration
            </p>
          </div>

          {/* Test Component */}
          <div className="mb-12">
            <GoogleCSETest />
          </div>

          {/* Google CSE Component Test */}
          <div className="mb-12">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Google CSE Component Test</h2>
              <GoogleCSESearch 
                searchQuery="software developer jobs"
                location="Remote"
                className="w-full"
              />
            </div>
          </div>

          {/* Raw Google CSE Test */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Raw Google CSE Test</h2>
            <p className="text-gray-600 mb-4">
              This is the raw Google CSE implementation. You should see search results below:
            </p>
            
            {/* Google CSE Script */}
            <script async src="https://cse.google.com/cse.js?cx=236ab1baa2d4f451d"></script>
            
            {/* Google CSE Search Box */}
            <div className="gcse-search" 
                 data-gname="jobsearch"
                 data-queryParameterName="q"
                 data-enableHistory="true"
                 data-newWindow="true">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
