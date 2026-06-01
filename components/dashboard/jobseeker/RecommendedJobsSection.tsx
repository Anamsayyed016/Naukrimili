'use client';

import Link from 'next/link';
import { Briefcase, Upload, Sparkles, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RecommendedJobCard from './RecommendedJobCard';
import type { DashboardStats, JobRecommendation } from './types';
import {
  dashboardPrimaryCtaClass,
  dashboardSecondaryCtaClass,
} from './dashboard-cta-classes';

interface RecommendedJobsSectionProps {
  jobs: JobRecommendation[];
  stats: DashboardStats | null;
  loading: boolean;
}

export default function RecommendedJobsSection({
  jobs,
  stats,
  loading,
}: RecommendedJobsSectionProps) {
  return (
    <section id="top-job-matches" className="scroll-mt-8">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Top Job Matches</h2>
          <p className="mt-0.5 text-sm text-slate-500">Ranked by your resume and profile</p>
        </div>
        {!loading && jobs.length > 0 && (
          <span className="hidden rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white sm:inline-flex">
            {jobs.length} roles
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200/60" />
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.slice(0, 6).map((job) => (
            <RecommendedJobCard key={String(job.id)} job={job} />
          ))}
        </div>
      ) : stats?.totalResumes === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-violet-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Upload your resume to unlock matches</p>
              <p className="text-sm text-slate-600">We&apos;ll extract skills and rank roles for you.</p>
            </div>
          </div>
          <Link href="/resumes/upload">
            <Button size="sm" className={dashboardPrimaryCtaClass}>
              Open Resume Studio
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl bg-slate-100/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3">
            <Briefcase className="h-5 w-5 shrink-0 text-slate-500" />
            <p className="text-sm text-slate-700">
              No scored matches right now — browse all openings or refine your profile.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/jobs">
              <Button size="sm" variant="outline" className={dashboardSecondaryCtaClass}>
                <Search className="mr-1.5 h-3.5 w-3.5" />
                Browse Jobs
              </Button>
            </Link>
            <Link href="/dashboard/jobseeker/profile">
              <Button size="sm" className={dashboardPrimaryCtaClass}>
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-[#FFFFFF]" />
                Profile
              </Button>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
