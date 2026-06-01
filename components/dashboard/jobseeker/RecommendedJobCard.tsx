'use client';

import Link from 'next/link';
import { MapPin, DollarSign, ArrowRight, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  dashboardPrimaryCtaClass,
  dashboardSecondaryCtaClass,
} from './dashboard-cta-classes';
import type { JobRecommendation } from './types';
import { resolveCompanyName } from './types';
import { saveJobNavigationSource } from '@/lib/job-navigation-state';

interface RecommendedJobCardProps {
  job: JobRecommendation;
}

function matchBadgeClass(score: number): string {
  if (score >= 90) return 'bg-emerald-600';
  if (score >= 80) return 'bg-blue-600';
  if (score >= 70) return 'bg-violet-600';
  return 'bg-slate-700';
}

export default function RecommendedJobCard({ job }: RecommendedJobCardProps) {
  const company = resolveCompanyName(job.company);
  const initials = company.slice(0, 2).toUpperCase();

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white p-4 ring-1 ring-slate-200/70 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-blue-200/80 sm:p-5">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500 opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex items-start gap-3">
        {job.companyLogo ? (
          <img
            src={job.companyLogo}
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl border border-slate-100 bg-white object-contain p-1"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-600">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge className={`border-0 px-2 py-0 text-[10px] font-semibold text-white ${matchBadgeClass(job.matchScore)}`}>
              {job.matchScore}% match
            </Badge>
            {job.isRemote && (
              <span className="text-[10px] font-medium text-emerald-600">Remote</span>
            )}
          </div>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 group-hover:text-blue-700">
            {job.title}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-600">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{company}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {job.location}
          </span>
        )}
        {job.salary && (
          <span className="flex items-center gap-1 font-medium text-emerald-700">
            <DollarSign className="h-3.5 w-3.5" />
            {job.salary}
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          asChild
          size="sm"
          className={`h-9 flex-1 text-xs font-semibold shadow-sm ${dashboardPrimaryCtaClass}`}
        >
          <Link
            href={`/jobs/${job.id}/apply`}
            onClick={() => saveJobNavigationSource('/dashboard/jobseeker')}
          >
            Apply
            <ArrowRight className="ml-1.5 h-3.5 w-3.5 text-[#FFFFFF]" />
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          className={`h-9 shrink-0 px-3 text-xs ${dashboardSecondaryCtaClass}`}
        >
          <Link
            href={`/jobs/${job.id}`}
            onClick={() => saveJobNavigationSource('/dashboard/jobseeker')}
          >
            Details
          </Link>
        </Button>
      </div>
    </article>
  );
}
