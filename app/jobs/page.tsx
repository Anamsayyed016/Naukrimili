"use client";

import React from "react";
import JobSearchHero from "@/components/JobSearchHero";
import JobsClient from "./JobsClient";

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Search */}
      <JobSearchHero />
      
      {/* Jobs List Section */}
      <div className="container mx-auto px-4 py-8">
        <JobsClient initialJobs={[]} />
      </div>
    </div>
  );
}