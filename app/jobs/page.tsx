"use client";

import React from "react";
import OptimizedJobsClient from "./OptimizedJobsClient";

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Jobs Section - Display Only (Filters on Home Page) */}
      {/* Added pt-16 sm:pt-20 lg:pt-24 to account for fixed navbar */}
      <div className="container mx-auto px-4 py-8 max-w-full pt-16 sm:pt-20 lg:pt-24">
        <OptimizedJobsClient initialJobs={[]} />
      </div>
    </div>
  );
}