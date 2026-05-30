'use client';

import Link from 'next/link';
import { MapPin, Building2, DollarSign, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { JobRecommendation } from './types';
import { resolveCompanyName } from './types';

interface RecommendedJobCardProps {
  job: JobRecommendation;
}

function matchBadgeClass(score: number): string {
  if (score >= 90) return 'bg-emerald-600 text-white';
  if (score >= 80) return 'bg-blue-600 text-white';
  if (score >= 70) return 'bg-violet-600 text-white';
  return 'bg-slate-600 text-white';
}

export default function RecommendedJobCard({ job }: RecommendedJobCardProps) {
  const company = resolveCompanyName(job.company);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge className={`border-0 px-2.5 py-0.5 text-xs font-semibold ${matchBadgeClass(job.matchScore)}`}>
          {job.matchScore}% Match
        </Badge>
        {job.isRemote && (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            Remote
          </Badge>
        )}
      </div>

      <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>

      <div className="mt-2 space-y-1.5 text-sm text-slate-600">
        <p className="flex items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{company}</span>
        </p>
        {job.location && (
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{job.location}</span>
          </p>
        )}
        {job.salary && (
          <p className="flex items-center gap-2 font-medium text-emerald-700">
            <DollarSign className="h-4 w-4 shrink-0" />
            <span>{job.salary}</span>
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link
          href={`/jobs/${job.id}/apply`}
          className="flex-1"
        >
          <Button className="w-full bg-slate-900 hover:bg-slate-800">
            Apply Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link
          href={`/jobs/${job.id}`}
          className="flex-1"
          onClick={() => {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('jobDetailsSource', '/dashboard/jobseeker');
            }
          }}
        >
          <Button variant="outline" className="w-full border-slate-200">
            View Details
          </Button>
        </Link>
      </div>
    </article>
  );
}
