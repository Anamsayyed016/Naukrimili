"use client";

import React, { useState } from "react";
import JobsClient from "./JobsClient";
import UnlimitedJobSearch from "@/components/jobs/UnlimitedJobSearch";

interface SearchParams {
  query: string;
  location: string;
  country: string;
  jobType: string;
  experienceLevel: string;
  isRemote: boolean;
  salaryMin: number;
  salaryMax: number;
  sector: string;
  page: number;
  limit: number;
}

export default function JobsPage() {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: '',
    location: '',
    country: 'IN',
    jobType: '',
    experienceLevel: '',
    isRemote: false,
    salaryMin: 0,
    salaryMax: 200000,
    sector: '',
    page: 1,
    limit: 50
  });
  
  const [totalJobs, setTotalJobs] = useState(0);
  const [sectors, setSectors] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (params: SearchParams) => {
    setSearchParams(params);
    setLoading(true);
    
    try {
      // Build search URL with parameters for unlimited search
      const searchUrl = new URLSearchParams({
        query: params.query || '',
        location: params.location || '',
        country: params.country || 'IN',
        jobType: params.jobType || '',
        experienceLevel: params.experienceLevel || '',
        isRemote: params.isRemote.toString(),
        salaryMin: params.salaryMin.toString(),
        salaryMax: params.salaryMax.toString(),
        sector: params.sector || '',
        page: params.page.toString(),
        limit: params.limit.toString(),
        includeExternal: 'true',
        includeDatabase: 'true',
        includeSample: 'true'
      });

      const response = await fetch(`/api/jobs/unlimited?${searchUrl.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setTotalJobs(data.pagination?.totalJobs || 0);
        setSectors(data.metadata?.sectors || []);
        setCountries(data.metadata?.countries || []);
      }
    } catch (error) {
      console.error('Error fetching job metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Dream Job
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover unlimited job opportunities across all sectors and industries. 
            Search through thousands of positions from top companies worldwide.
          </p>
        </div>

        {/* Unlimited Search Component */}
        <UnlimitedJobSearch
          onSearch={handleSearch}
          loading={loading}
          totalJobs={totalJobs}
          sectors={sectors}
          countries={countries}
        />

        {/* Jobs Results */}
        <div className="mt-8">
          <JobsClient initialJobs={[]} />
        </div>
      </div>
    </div>
  );
}