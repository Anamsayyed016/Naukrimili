'use client';

import Link from 'next/link';
import { Upload, CheckCircle, Edit, Search, Sparkles } from 'lucide-react';
import type { DashboardStats } from './types';

interface QuickActionsProps {
  stats: DashboardStats | null;
}

const cardClass =
  'group rounded-xl border border-slate-200/80 bg-white p-5 text-center shadow-sm transition-all hover:border-blue-200 hover:shadow-md';

export default function QuickActions({ stats }: QuickActionsProps) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Sparkles className="h-5 w-5 text-blue-600" />
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats && stats.totalResumes > 0 ? (
          <Link href="/dashboard/jobseeker/resumes" className={cardClass}>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Resume Synced</h3>
            <p className="mt-1 text-sm text-slate-500">View &amp; edit in Studio</p>
          </Link>
        ) : (
          <Link href="/resumes/upload" className={cardClass}>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Upload Resume</h3>
            <p className="mt-1 text-sm text-slate-500">Open Resume Studio</p>
          </Link>
        )}

        <Link href="/dashboard/jobseeker/profile" className={cardClass}>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50">
            <Edit className="h-6 w-6 text-violet-600" />
          </div>
          <h3 className="font-semibold text-slate-900">Edit Profile</h3>
          <p className="mt-1 text-sm text-slate-500">Update your details</p>
        </Link>

        <Link href="/jobs" className={cardClass}>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <Search className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-slate-900">View Jobs</h3>
          <p className="mt-1 text-sm text-slate-500">Browse all openings</p>
        </Link>
      </div>
    </section>
  );
}
