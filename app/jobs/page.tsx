"use client";

import React from "react";
import OptimizedJobsClient from "./OptimizedJobsClient";
import FilterDebug from "@/components/FilterDebug";

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gray-50">

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