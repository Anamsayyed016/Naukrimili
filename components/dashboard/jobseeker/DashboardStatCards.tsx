'use client';

import Link from 'next/link';
import {
  User,
  Target,
  Send,
  Bookmark,
  FileText,
} from 'lucide-react';
import type { DashboardStats } from './types';

interface DashboardStatCardsProps {
  stats: DashboardStats;
  recommendedCount: number;
  resumeScore: number | null;
}

const STAT_ACCENTS = [
  'from-blue-500/10 to-blue-600/5 text-blue-700',
  'from-violet-500/10 to-violet-600/5 text-violet-700',
  'from-emerald-500/10 to-emerald-600/5 text-emerald-700',
  'from-amber-500/10 to-amber-600/5 text-amber-700',
  'from-rose-500/10 to-rose-600/5 text-rose-700',
];

export default function DashboardStatCards({
  stats,
  recommendedCount,
  resumeScore,
}: DashboardStatCardsProps) {
  const items = [
    {
      label: 'Profile',
      value: `${stats.profileCompletion}%`,
      sub: 'complete',
      icon: User,
      href: '/dashboard/jobseeker/profile',
    },
    {
      label: 'Matches',
      value: String(recommendedCount),
      sub: 'recommended',
      icon: Target,
      href: '#top-job-matches',
    },
    {
      label: 'Applied',
      value: String(stats.totalApplications),
      sub: 'jobs',
      icon: Send,
      href: '/dashboard/jobseeker/applications',
    },
    {
      label: 'Saved',
      value: String(stats.totalBookmarks),
      sub: 'jobs',
      icon: Bookmark,
      href: '/jobs',
    },
    {
      label: 'Resume',
      value: resumeScore != null ? String(resumeScore) : '—',
      sub: 'ATS score',
      icon: FileText,
      href: '/dashboard/jobseeker/resumes',
    },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-5">
      {items.map((item, index) => (
        <Link
          key={item.label}
          href={item.href}
          className={`group flex min-w-[132px] shrink-0 items-center gap-3 rounded-2xl bg-gradient-to-br px-3.5 py-3 ring-1 ring-slate-200/70 transition-all hover:ring-slate-300 hover:shadow-sm sm:min-w-0 ${STAT_ACCENTS[index]}`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
            <item.icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-none text-slate-900">{item.value}</p>
            <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {item.label} · {item.sub}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
