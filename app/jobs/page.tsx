"use client";

import React from "react";
import { Suspense } from "react";
import IndianJobPortal from "../../components/IndianJobPortal";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

// Loading component
function JobsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-12">
          <div className="h-16 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl mb-4 animate-pulse"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mx-auto animate-pulse"></div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 mb-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6 w-1/3 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-48"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl shadow-md border p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/2"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Extract search params for initial values
interface JobsPageProps {
  searchParams?: {
    what?: string;
    where?: string;
    experience?: string;
  };
}

export default function JobsPage({ searchParams }: JobsPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job Search Portal</h1>
              <p className="text-sm text-gray-600">Find your dream job with AI-powered search</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium text-gray-700">Live Jobs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={<JobsLoading />}>
        <IndianJobPortal 
          initialQuery={searchParams?.what || "developer"}
          initialLocation={searchParams?.where || "London"}
        />
      </Suspense>
    </div>
  );
}
