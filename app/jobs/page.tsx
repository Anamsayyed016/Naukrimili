"use client";

import React from "react";
import OptimizedJobsClient from "./OptimizedJobsClient";
import FilterDebug from "@/components/FilterDebug";

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Dream Job
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover truly unlimited job opportunities across all sectors and industries. Search through thousands of positions from top companies worldwide with comprehensive results and advanced filtering.
          </p>
        </div>

        {/* Jobs Results - No filters, just jobs */}
        <div className="mt-8">
              <OptimizedJobsClient initialJobs={[]} />
        </div>
      </div>
      
      {/* Debug Component - Remove in production */}
      <FilterDebug />
    </div>
  );
}