'use client';

import Link from 'next/link';
import { Briefcase, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RecommendedJobCard from './RecommendedJobCard';
import type { DashboardStats, JobRecommendation } from './types';

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
    <section id="top-job-matches" className="scroll-mt-8 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Top Job Matches</h2>
          <p className="text-sm text-slate-500">Personalized from your resume and profile</p>
        </div>
        {!loading && jobs.length > 0 && (
          <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {jobs.length} matches
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.slice(0, 6).map((job) => (
            <RecommendedJobCard key={String(job.id)} job={job} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <Briefcase className="h-7 w-7 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            {stats?.totalResumes === 0
              ? 'Upload your resume to unlock matches'
              : 'No job matches yet'}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            {stats?.totalResumes === 0
              ? 'We use your parsed skills and experience to surface the best roles for you.'
              : 'Complete your profile or check back soon as new jobs are added.'}
          </p>
          {stats?.totalResumes === 0 && (
            <Link href="/resumes/upload" className="mt-6 inline-block">
              <Button className="bg-slate-900 hover:bg-slate-800">
                <Upload className="mr-2 h-4 w-4" />
                Open Resume Studio
              </Button>
            </Link>
          )}
          {stats && stats.totalResumes > 0 && (
            <Link href="/jobs" className="mt-6 inline-block">
              <Button variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                Browse All Jobs
              </Button>
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
