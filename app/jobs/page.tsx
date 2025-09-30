"use client";

import React from "react";
import OptimizedJobsClient from "./OptimizedJobsClient";
import UnifiedJobSearch from "@/components/UnifiedJobSearch";

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Unified Search - Jobs Page Variant */}
      <div className="container mx-auto px-4 py-8">
        <UnifiedJobSearch 
          variant="jobs-page"
          showAdvancedFilters={false}
          showSuggestions={false}
          showLocationCategories={false}
          autoSearch={false}
        />
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Jobs Results */}
        <div className="mt-8">
          <OptimizedJobsClient initialJobs={[]} />
        </div>
      </div>
      
    </div>
  );
}