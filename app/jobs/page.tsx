"use client";

import React from "react";
import OptimizedJobsClient from "./OptimizedJobsClient";

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/90 overflow-x-hidden">
      {/* Jobs Section - Display Only (Filters on Home Page) */}
      {/* Body already has padding-top for fixed navbar, so no need for extra padding here */}
      <div className="w-full px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
        <OptimizedJobsClient initialJobs={[]} />
      </div>
    </div>
  );
}