"use client";

import React from "react";
import OptimizedJobsClient from "./OptimizedJobsClient";
import JobSearchHero from "@/components/JobSearchHero";

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Hero Section */}
      <JobSearchHero className="mb-0" />

      <div className="container mx-auto px-4 py-8">
        {/* Jobs Results */}
        <div className="mt-8">
          <OptimizedJobsClient initialJobs={[]} />
        </div>
      </div>
      
    </div>
  );
}