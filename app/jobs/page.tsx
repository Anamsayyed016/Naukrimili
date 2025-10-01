"use client";

import React from "react";
import OptimizedJobsClient from "./OptimizedJobsClient";

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Jobs Section - Display Only (Filters on Home Page) */}
      <div className="container mx-auto px-4 py-8">
        <OptimizedJobsClient initialJobs={[]} />
      </div>
    </div>
  );
}