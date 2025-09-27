"use client";

import React from "react";
import OptimizedJobsClient from "./OptimizedJobsClient";
import FilterDebug from "@/components/FilterDebug";
import EnhancedJobSearchHero from "@/components/EnhancedJobSearchHero";

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Search Hero with History & AI Suggestions */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <EnhancedJobSearchHero
          showHistory={true}
          showSuggestions={true}
          showAdvancedFilters={true}
        />
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Jobs Results */}
        <div className="mt-8">
          <OptimizedJobsClient initialJobs={[]} />
        </div>
      </div>
      
      {/* Debug Component - Remove in production */}
      <FilterDebug />
    </div>
  );
}