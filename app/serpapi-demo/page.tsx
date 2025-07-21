import React from 'react';
import SerpApiJobSearch from '@/components/SerpApiJobSearch';
import { SerpApiStatus } from '@/components/SerpApiStatus';

export default function SerpApiDemoPage() {
  return (
    <div className="min-h-screen">
      {/* Status Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <SerpApiStatus />
        </div>
      </div>
      
      {/* Main Content */}
      <SerpApiJobSearch />
    </div>
  );
}
