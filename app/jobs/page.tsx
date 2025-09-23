"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const [searchState, setSearchState] = useState<SearchParams>({
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
  const [isFromHomepage, setIsFromHomepage] = useState(false);

  // Check if coming from homepage search
  useEffect(() => {
    const unlimited = searchParams.get('unlimited');
    const query = searchParams.get('q');
    const location = searchParams.get('location');
    
    if (unlimited === 'true' || query || location) {
      setIsFromHomepage(true);
      
      // Update search state from URL params
      setSearchState(prev => ({
        ...prev,
        query: query || '',
        location: location || '',
        jobType: searchParams.get('jobType') || '',
        experienceLevel: searchParams.get('experienceLevel') || '',
        isRemote: searchParams.get('isRemote') === 'true',
        salaryMin: parseInt(searchParams.get('salaryMin') || '0'),
        salaryMax: parseInt(searchParams.get('salaryMax') || '200000'),
        limit: parseInt(searchParams.get('limit') || '100')
      }));
    }
  }, [searchParams]);

  const handleSearch = async (params: SearchParams) => {
    setSearchState(params);
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
            {isFromHomepage ? 'Search Results' : 'Find Your Dream Job'}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {isFromHomepage 
              ? 'Discover unlimited job opportunities based on your search criteria'
              : 'Discover unlimited job opportunities across all sectors and industries. Search through thousands of positions from top companies worldwide.'
            }
          </p>
        </div>

        {/* Show search component only if not from homepage */}
        {!isFromHomepage && (
          <UnlimitedJobSearch
            onSearch={handleSearch}
            loading={loading}
            totalJobs={totalJobs}
            sectors={sectors}
            countries={countries}
          />
        )}

        {/* Jobs Results */}
        <div className="mt-8">
          <JobsClient initialJobs={[]} />
        </div>
      </div>
    </div>
  );
}