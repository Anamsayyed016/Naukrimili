"use client";

import React from "react";
import OptimizedJobsClient from "./OptimizedJobsClient";
import JobSearchHero from "@/components/JobSearchHero";

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Hero Section - No Advanced Filters */}
      <JobSearchHero className="mb-0" showAdvancedFilters={false} />

      <div className="container mx-auto px-4 py-8">
        {/* Jobs Results */}
        <div className="mt-8">
          <OptimizedJobsClient initialJobs={[]} />
        </div>
      </div>
      
    </div>
  );
}