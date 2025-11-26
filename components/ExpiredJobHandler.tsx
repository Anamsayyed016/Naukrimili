"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, ArrowRight, MapPin, Building2, DollarSign } from "lucide-react";
import Link from 'next/link';
import { safeLength, safeArray } from "@/lib/safe-array-utils";

interface ExpiredJob {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  isExternal: boolean;
  applyUrl: string | null;
  sourceUrl: string | null;
}

interface SimilarJob {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  isExternal: boolean;
  applyUrl: string | null;
  sourceUrl: string | null;
  isFeatured: boolean;
  sector: string | null;
  postedAt: string | null;
}

interface ExpiredJobHandlerProps {
  expiredJob: ExpiredJob;
  similarJobs: SimilarJob[];
}

export default function ExpiredJobHandler({ expiredJob, similarJobs }: ExpiredJobHandlerProps) {
  const formatSalary = (min: number | null, max: number | null, currency: string | null) => {
    if (!min && !max) return null;
    const curr = currency || 'INR';
    if (min && max) return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${curr} ${min.toLocaleString()}+`;
    if (max) return `Up to ${curr} ${max.toLocaleString()}`;
    return null;
  };

  const handleExternalApply = (job: SimilarJob) => {
    if (job.sourceUrl) {
      window.open(job.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* Expired Job Notice */}
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-orange-800">Job Expired</CardTitle>
                <p className="text-orange-600 mt-1">
                  This job posting is no longer available
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {expiredJob.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                {expiredJob.company && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <span>{expiredJob.company}</span>
                  </div>
                )}
                {expiredJob.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{expiredJob.location}</span>
                  </div>
                )}
                {formatSalary(expiredJob.salaryMin, expiredJob.salaryMax, expiredJob.salaryCurrency) && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{formatSalary(expiredJob.salaryMin, expiredJob.salaryMax, expiredJob.salaryCurrency)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  This job has expired. Check similar opportunities below.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Similar Jobs */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Similar Jobs You Might Like 👇
          </h2>
          <p className="text-gray-600 mb-6">
            We found {safeLength(similarJobs || [])} similar job opportunities that match your interests.
          </p>
        </div>

        {/* Similar Jobs Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {safeArray(similarJobs).map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight mb-2">
                      {job.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      {job.company && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          <span>{job.company}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {job.isFeatured && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Featured
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency) && (
                    <div className="flex items-center gap-1 text-green-600 font-medium">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
                    </div>
                  )}
                  
                  {job.sector && (
                    <Badge variant="outline" className="text-xs">
                      {job.sector}
                    </Badge>
                  )}

                  <div className="flex gap-2">
                    <Link 
                      href={`/jobs/${(job as any).sourceId || job.id}`}
                      onClick={() => {
                        // PRESERVE NAVIGATION STATE: Save current page as source
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem('jobDetailsSource', window.location.pathname);
                        }
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    
                    {job.isExternal && job.sourceUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExternalApply(job)}
                        className="px-3"
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="py-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Didn&apos;t find what you&apos;re looking for?
              </h3>
              <p className="text-gray-600 mb-6">
                Explore more job opportunities or set up job alerts to get notified about new openings.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/jobs"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Browse All Jobs
                </Link>
                <Link
                  href="/dashboard"
                  className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Set Job Alerts
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
